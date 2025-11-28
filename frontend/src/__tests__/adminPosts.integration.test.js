import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddPost from '../AddPost';
import AdminDashboard from '../AdminDashboard';

describe('Admin posts integration (create / edit / delete)', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn((url, opts) => {
      // simple router for mocked endpoints used in tests
      const method = (opts && opts.method) || 'GET';
      if (url.includes('/api/recent-posts/')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (/\/api\/posts\/\?q=/.test(url)) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (/\/api\/posts\/\d+\/$/.test(url) && method === 'GET') {
        // return a dummy post
        return Promise.resolve({ ok: true, json: async () => ({ id: 5, title: 'Dummy', content: 'Body', images: [] }) });
      }
      if (url.endsWith('/api/posts/') && method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 7, title: 'Created', content: 'C' }) });
      }
      if (/\/api\/posts\/\d+\/$/.test(url) && method === 'PATCH') {
        return Promise.resolve({ ok: true, json: async () => ({ id: 5, title: 'Updated', content: 'Updated content' }) });
      }
      if (/\/api\/posts\/\d+\/$/.test(url) && method === 'DELETE') {
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) });
      }
      // fallback
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('AddPost creates a post and calls onCreated', async () => {
    const onCreated = jest.fn();
    render(<AddPost onCreated={onCreated} />);

    // fill form
    fireEvent.change(screen.getByPlaceholderText(/Enter an engaging title/i), { target: { value: 'New Post' } });
    fireEvent.change(screen.getByPlaceholderText(/Write your post content here/i), { target: { value: 'Hello world' } });

    // click publish -> opens confirm overlay
    fireEvent.click(screen.getByText(/Publish Post/i));

    // confirm
    await waitFor(() => screen.getByText(/Confirm & Publish/i));
    fireEvent.click(screen.getByText(/Confirm & Publish/i));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });

  test('AddPost edits a post and calls onUpdated', async () => {
    const onUpdated = jest.fn();
    const initialPost = { id: 5, title: 'Old', content: 'Old content', images: [] };
    render(<AddPost initialPost={initialPost} onUpdated={onUpdated} />);

    // title should be prefilled
    expect(screen.getByDisplayValue(/Old/)).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue(/Old/), { target: { value: 'Old (edited)' } });
    fireEvent.click(screen.getByText(/Publish Post/i));

    await waitFor(() => screen.getByText(/Confirm & Publish/i));
    fireEvent.click(screen.getByText(/Confirm & Publish/i));

    await waitFor(() => expect(onUpdated).toHaveBeenCalled());
  });

  test('AdminDashboard handles delete event (calls DELETE)', async () => {
    // Provide minimal user prop
    const user = { username: 'admin' };
    render(<AdminDashboard user={user} onLogout={() => {}} />);

    // dispatch delete event for post id 5
    window.dispatchEvent(new CustomEvent('admin-delete-post', { detail: { postId: 5 } }));

    // wait for fetch DELETE to be called
    await waitFor(() => {
      const calledDelete = global.fetch.mock.calls.find(call => {
        const url = call[0] || '';
        const opts = call[1] || {};
        return /\/api\/posts\/5\//.test(url) && (opts.method === 'DELETE');
      });
      expect(calledDelete).toBeTruthy();
    });
  });
});
