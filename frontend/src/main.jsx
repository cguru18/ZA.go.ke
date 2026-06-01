import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Global Axios response interceptor for cross-origin and connection failures
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error' || !error.response) {
      console.error('API Connection Diagnostic Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      const standardizedError = {
        success: false,
        message: "Server connection failed. Please check your internet connectivity or API cross-origin permissions.",
        response: {
          data: {
            success: false,
            message: "Server connection failed. Please check your internet connectivity or API cross-origin permissions."
          }
        }
      };
      return Promise.reject(standardizedError);
    }
    return Promise.reject(error);
  }
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW Registered:', reg.scope))
      .catch(err => console.log('SW Registration Failed:', err));
  });
}
