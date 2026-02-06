
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Toaster } from 'react-hot-toast';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-[1600px] mx-auto py-6 sm:px-6 lg:px-8">
            <Outlet />
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} E-Market. All rights reserved.
        </div>
      </footer>
      <Toaster position="bottom-right" toastOptions={{ className: 'dark:bg-gray-800 dark:text-white' }} />
    </div>
  );
};
