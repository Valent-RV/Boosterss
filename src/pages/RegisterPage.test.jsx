import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './RegisterPage'; 

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const mockShowToast = vi.fn();
const mockSetUser = vi.fn();
const mockSetAuthLoading = vi.fn();

vi.mock('../context/AppContext.jsx', () => ({
  useApp: () => ({
    authLoading: false, 
    setAuthLoading: mockSetAuthLoading,
    setUser: mockSetUser,
    showToast: mockShowToast,
  }),
}));

describe('Unit-тестування компонента <RegisterPage />', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('всі поля вводу та кнопка успішно відображаються', () => {
    render(<RegisterPage />);
    
    expect(screen.getByLabelText(/Електронна пошта/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Пароль/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Зареєструватися/i })).toBeInTheDocument();
  });

  test('кнопка реєстрації заблокована, якщо поля порожні', () => {
    render(<RegisterPage />);
    
    const button = screen.getByRole('button', { name: /Зареєструватися/i });
    expect(button).toBeDisabled();
  });

  test('кнопка стає активною, якщо заповнити обидва поля', () => {
    render(<RegisterPage />);
    
    const emailInput = screen.getByLabelText(/Електронна пошта/i);
    const passwordInput = screen.getByLabelText(/Пароль/i);
    const button = screen.getByRole('button', { name: /Зареєструватися/i });

    fireEvent.change(emailInput, { target: { value: 'newuser@taskero.local' } });
    fireEvent.change(passwordInput, { target: { value: 'mysecretpassword' } });

    expect(button).not.toBeDisabled();
  });

});