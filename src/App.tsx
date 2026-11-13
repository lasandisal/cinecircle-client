import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppRoutes } from './routes/AppRoutes';
import { useAppDispatch } from './hooks/useAppRedux';
import { fetchCurrentUser } from './store/slices/authSlice';
import { ToastProvider } from './components/common/ToastProvider';

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('cinecircle_token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

