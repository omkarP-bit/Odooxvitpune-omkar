import { Toaster } from 'react-hot-toast';

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          className: 'toast-custom',
          style: {
            background: '#0F172A',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '0.84rem',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}
