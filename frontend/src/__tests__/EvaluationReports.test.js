import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EvaluationReports from '../EvaluationReports';

// simple mock for fetch
const mockAggregates = {
  employed: { yes: 2, no: 1 },
  sources: { 'On-campus': 1 },
  performance: { Excellent: 2, Good: 1 },
  programs: { 'Comp Sci': 2, 'Math': 1 },
  jobs_related: { Software: 2 },
  promoted: {},
  self_employment: {},
  job_difficulties: {},
  count: 3,
  total_count: 3
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockAggregates) }));
  // mock clipboard
  Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('autocomplete shows suggestions when typing', async () => {
  render(<EvaluationReports />);

  const input = await screen.findByPlaceholderText(/Search or select a program/i);
  fireEvent.change(input, { target: { value: 'Comp' } });

  // suggestions render after debounce (450ms) or immediate filter for suggestions list
  await waitFor(() => expect(screen.getByText(/Comp Sci/)).toBeInTheDocument(), { timeout: 1000 });
});

test('copy decision tree triggers clipboard write', async () => {
  render(<EvaluationReports />);

  // wait for decision tree to be generated (runAnalysis runs after aggregates arrive)
  await waitFor(() => expect(screen.getByText(/Decision tree|Decision path/)).toBeInTheDocument(), { timeout: 2000 });

  const btn = screen.getByRole('button', { name: /Copy decision tree|Copy/i });
  fireEvent.click(btn);

  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled(), { timeout: 1000 });
});

test('clicking top program stat sets program filter input', async () => {
  render(<EvaluationReports />);

  // wait for the top program to appear in the stat area
  await waitFor(() => expect(screen.getByText(/Top program/i)).toBeInTheDocument(), { timeout: 1000 });

  // the value will include 'Comp Sci' from our mockAggregates
  const topProgramButton = await screen.findByText(/Comp Sci/);
  fireEvent.click(topProgramButton);

  const input = screen.getByPlaceholderText(/Search or select a program/i);
  // after clicking, the input value should update to the program name
  await waitFor(() => expect(input.value).toBe('Comp Sci'), { timeout: 500 });
});
