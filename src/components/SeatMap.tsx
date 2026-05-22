'use client';

import React from 'react';

interface SeatMapProps {
  capacity: number;
  layout: string;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  maxSelectable?: number;
}

export default function SeatMap({
  capacity,
  layout,
  bookedSeats,
  selectedSeats,
  onSeatSelect,
  maxSelectable = 5
}: SeatMapProps) {
  
  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return;
    
    // If trying to select a new seat but max reached
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= maxSelectable) {
      alert(`You can only select up to ${maxSelectable} seats.`);
      return;
    }
    
    onSeatSelect(seatId);
  };

  // Determine grid template based on layout
  // E.g. "2x2" -> 2 seats, aisle, 2 seats
  // "2x3" -> 2 seats, aisle, 3 seats
  // "1x2" -> 1 seat, aisle, 2 seats
  const [leftCols, rightCols] = layout === 'VIP' ? [1, 2] : layout.split('x').map(Number);
  
  if (!leftCols || !rightCols) {
    return <div style={{ color: 'var(--text-secondary)' }}>Invalid layout specified.</div>;
  }

  const totalColsPerRow = leftCols + rightCols;
  const numRows = Math.ceil(capacity / totalColsPerRow);

  const rows = [];
  let seatCounter = 1;

  for (let r = 0; r < numRows; r++) {
    const rowLetter = String.fromCharCode(65 + r); // A, B, C...
    const rowSeats = [];

    // Left block
    for (let c = 0; c < leftCols; c++) {
      if (seatCounter <= capacity) {
        rowSeats.push(`${rowLetter}${c + 1}`);
        seatCounter++;
      }
    }
    
    // Aisle placeholder
    rowSeats.push('AISLE');

    // Right block
    for (let c = 0; c < rightCols; c++) {
      if (seatCounter <= capacity) {
        rowSeats.push(`${rowLetter}${leftCols + c + 1}`);
        seatCounter++;
      }
    }

    rows.push(rowSeats);
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      margin: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '300px', 
        padding: '12px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '8px', 
        textAlign: 'center',
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        Driver / Front
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map((row, rIndex) => (
          <div key={`row-${rIndex}`} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {row.map((seatId, sIndex) => {
              if (seatId === 'AISLE') {
                return <div key={`aisle-${rIndex}`} style={{ width: '30px' }} />; // Aisle gap
              }

              const isBooked = bookedSeats.includes(seatId);
              const isSelected = selectedSeats.includes(seatId);
              
              let bg = 'rgba(255, 255, 255, 0.08)';
              let border = '1px solid rgba(255, 255, 255, 0.2)';
              let color = 'var(--text-primary)';
              let cursor = 'pointer';

              if (isBooked) {
                bg = 'rgba(255, 255, 255, 0.02)';
                border = '1px solid rgba(255, 255, 255, 0.05)';
                color = 'rgba(255, 255, 255, 0.2)';
                cursor = 'not-allowed';
              } else if (isSelected) {
                bg = 'var(--primary)';
                border = '1px solid var(--primary-light)';
                color = 'white';
              }

              return (
                <button
                  key={seatId}
                  onClick={(e) => { e.preventDefault(); handleSeatClick(seatId); }}
                  disabled={isBooked}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: bg,
                    border: border,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: cursor,
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  title={isBooked ? 'Seat taken' : `Select seat ${seatId}`}
                >
                  {seatId}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginTop: '20px', 
        paddingTop: '20px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--primary)', border: '1px solid var(--primary-light)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Booked</span>
        </div>
      </div>
    </div>
  );
}
