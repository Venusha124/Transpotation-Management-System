'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'si' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.book': 'Book Ticket',
    'nav.track': 'Track Bus',
    'nav.tickets': 'My Tickets',
    'book.title': 'Book Your Journey',
    'book.subtitle': 'Select your route and travel dates',
    'book.pickup': 'Pickup Location',
    'book.destination': 'Destination',
    'book.date': 'Travel Date',
    'book.class': 'Passenger Class',
    'book.confirm': 'Confirm Booking',
    'book.select_seats': 'Select your seats',
    'tickets.title': 'My Tickets',
    'tickets.subtitle': 'Your booking manifest & invoices',
    'tickets.pay_now': 'Pay Now',
    'tickets.paid': 'PAID',
    'tickets.pending': 'PENDING',
    'track.title': 'Track Bus',
    'track.subtitle': 'Enter tracking ID to view live location'
  },
  si: {
    'nav.home': 'මුල් පිටුව',
    'nav.book': 'ප්‍රවේශපත්‍රය වෙන්කරන්න',
    'nav.track': 'බස් රථය සොයන්න',
    'nav.tickets': 'මගේ ප්‍රවේශපත්‍ර',
    'book.title': 'ඔබේ ගමන වෙන්කරන්න',
    'book.subtitle': 'ඔබේ මාර්ගය සහ ගමන් දිනය තෝරන්න',
    'book.pickup': 'පිටත්වන ස්ථානය',
    'book.destination': 'ගමනාන්තය',
    'book.date': 'ගමන් දිනය',
    'book.class': 'මගී පන්තිය',
    'book.confirm': 'වෙන්කිරීම තහවුරු කරන්න',
    'book.select_seats': 'ඔබේ ආසන තෝරන්න',
    'tickets.title': 'මගේ ප්‍රවේශපත්‍ර',
    'tickets.subtitle': 'ඔබේ වෙන්කිරීම් සහ ඉන්වොයිසි',
    'tickets.pay_now': 'දැන් ගෙවන්න',
    'tickets.paid': 'ගෙවා ඇත',
    'tickets.pending': 'පොරොත්තු',
    'track.title': 'බස් රථය සොයන්න',
    'track.subtitle': 'සජීවී ස්ථානය බැලීමට ලුහුබැඳීමේ හැඳුනුම්පත ඇතුලත් කරන්න'
  },
  ta: {
    'nav.home': 'முகப்பு',
    'nav.book': 'டிக்கெட் முன்பதிவு',
    'nav.track': 'பேருந்தை கண்காணிக்க',
    'nav.tickets': 'என் டிக்கெட்டுகள்',
    'book.title': 'உங்கள் பயணத்தை முன்பதிவு செய்யுங்கள்',
    'book.subtitle': 'உங்கள் வழித்தடம் மற்றும் பயண தேதியை தேர்ந்தெடுக்கவும்',
    'book.pickup': 'புறப்படும் இடம்',
    'book.destination': 'சேருமிடம்',
    'book.date': 'பயண தேதி',
    'book.class': 'பயணிகள் வகுப்பு',
    'book.confirm': 'முன்பதிவை உறுதிப்படுத்தவும்',
    'book.select_seats': 'உங்கள் இருக்கைகளைத் தேர்ந்தெடுக்கவும்',
    'tickets.title': 'என் டிக்கெட்டுகள்',
    'tickets.subtitle': 'உங்கள் முன்பதிவுகள் மற்றும் விலைப்பட்டியல்கள்',
    'tickets.pay_now': 'இப்போது செலுத்தவும்',
    'tickets.paid': 'செலுத்தப்பட்டது',
    'tickets.pending': 'நிலுவையில்',
    'track.title': 'பேருந்தை கண்காணிக்க',
    'track.subtitle': 'நேரடி இருப்பிடத்தைக் காண கண்காணிப்பு ஐடியை உள்ளிடவும்'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
