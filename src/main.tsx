import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './index.css';
import { installStaticApiInterceptor } from './lib/api/static-interceptor';

// Install static API interceptor for GitHub Pages / static deployments
// This routes /api/* calls directly to Pollinations.ai when no backend is available
installStaticApiInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
