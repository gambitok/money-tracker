import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar } from 'react-native-paper';

type FeedbackContextValue = {
  showMessage: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const showMessage = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    setVisible(true);
  }, []);

  const value = useMemo(() => ({ showMessage }), [showMessage]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar visible={visible} onDismiss={() => setVisible(false)} duration={2500}>
        {message}
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used inside FeedbackProvider');
  return context;
}
