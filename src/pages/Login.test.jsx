import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Login from './Login'; 

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('Unit-тестування компонента <Login />', () => {

  test('кнопка Login заблокована при порожніх полях', () => {
    render(<Login />);
    
    const button = screen.getByRole('button', { name: /login/i });
    
    expect(button).toBeDisabled();
  });

  test('показує повідомлення про помилку при введенні неправильного email', () => {
    render(<Login />);
    const emailInput = screen.getByPlaceholderText('Email');

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const errorMessage = screen.getByText(/Введіть правильну email адресу/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('показує помилку при введенні слабкого пароля', () => {
    render(<Login />);
    const passwordInput = screen.getByPlaceholderText('Password');

    fireEvent.change(passwordInput, { target: { value: 'weakpass123' } });

    const errorMessage = screen.getByText(/Пароль має містити 8 символів/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('кнопка Login стає активною, якщо ввести правильні дані', () => {
    render(<Login />);
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass2026' } }); // Є великі літери, цифри, >8 символів

    expect(button).not.toBeDisabled();
  });

});