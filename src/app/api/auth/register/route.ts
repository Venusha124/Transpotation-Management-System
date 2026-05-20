import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, role = 'CUSTOMER' } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash Password
    const passwordHash = hashPassword(password);

    // Create User
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role
      }
    });

    // If the registered role is DRIVER, we create a basic driver profile
    if (role === 'DRIVER') {
      await db.driver.create({
        data: {
          name,
          nic: `NIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          contact: "+1-555-0000",
          address: "Update Address",
          licenseNumber: `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          experience: 1,
          emergencyContact: "+1-555-0000",
          salary: 2000.0,
          availability: true,
          rating: 5.0,
          userId: newUser.id
        }
      });
    }

    // Sign JWT
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

    // Set auth cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        userId: newUser.id,
        action: "Registration",
        details: `New account created: ${name} (${role})`
      }
    });

    // Welcome Notification
    await db.notification.create({
      data: {
        userId: newUser.id,
        title: "Registration Successful",
        message: `Welcome to the Transportation Management System, ${name}! Your account is now active.`,
        type: "Alert"
      }
    });

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
