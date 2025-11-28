import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProgramHeadForm from '../CreateProgramHeadForm';
import { ToastProvider } from '../Toast';

test('submitting form calls handleCreateUser and appends created user via setUsers', async () => {
  const mockHandleCreateUser = jest.fn(async () => ({ id: 123, username: 'ph_test_1', user_type: 'program_head' }));
  const mockSetUsers = jest.fn();
  const mockSetUsername = jest.fn();
  const mockSetPassword = jest.fn();
  const mockSetCreateName = jest.fn();
  const mockSetCreateSurname = jest.fn();
  const mockSetCreateGender = jest.fn();
  const mockSetCreateFaculty = jest.fn();
  const mockSetCreateProgram = jest.fn();
  const mockSetShowCreateForm = jest.fn();
  const mockSetError = jest.fn();

  render(
    <ToastProvider>
      <CreateProgramHeadForm
        username={'ph_test_1'}
        setUsername={mockSetUsername}
        password={'secret'}
        setPassword={mockSetPassword}
        createName={'Test'}
        setCreateName={mockSetCreateName}
        createSurname={'ProgramHead'}
        setCreateSurname={mockSetCreateSurname}
        createMI={''}
        setCreateMI={() => {}}
        createGender={'male'}
        setCreateGender={mockSetCreateGender}
        createContact={'09123456789'}
        setCreateContact={() => {}}
        createEmail={'ph_test1@example.com'}
        setCreateEmail={() => {}}
        createFaculty={'FICT'}
        setCreateFaculty={mockSetCreateFaculty}
        createProgram={'Computer Science'}
        setCreateProgram={mockSetCreateProgram}
        showCreatePassword={false}
        setShowCreatePassword={() => {}}
        handleCreateUser={mockHandleCreateUser}
        setShowCreateForm={mockSetShowCreateForm}
        setError={mockSetError}
        setUsers={mockSetUsers}
        facultyPrograms={{ 'FICT': ['Computer Science'] }}
      />
    </ToastProvider>
  );

  // Find and click the Create button
  const btn = screen.getByRole('button', { name: /create/i });
  fireEvent.click(btn);

  await waitFor(() => expect(mockHandleCreateUser).toHaveBeenCalled());
  // Ensure setUsers was called with the created object appended
  await waitFor(() => expect(mockSetUsers).toHaveBeenCalled());
  // Confirm created user was passed
  const arg = mockSetUsers.mock.calls[0][0];
  // The setter receives a function in our implementation; call it with an empty array to see result
  const result = typeof arg === 'function' ? arg([]) : arg;
  expect(result).toEqual([{ id: 123, username: 'ph_test_1', user_type: 'program_head' }]);
});
