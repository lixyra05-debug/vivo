import { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar } from 'react-native-paper';
import { Colors } from '@/src/constants/colors';

interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={2500}
        action={{ label: 'OK', textColor: Colors.sage }}
        style={{ backgroundColor: Colors.text, borderRadius: 14, marginBottom: 72 }}
        theme={{ colors: { onSurface: '#fff' } }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
}
