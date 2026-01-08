import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RecentLogsTable } from "./RecentLogsTable";

// Mock fetch for logs

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: "1", txn: "txnA", message: "Log message A", time: "2026-01-08T12:00:00Z" },
        { id: "2", txn: "txnB", message: "Log message B", time: "2026-01-08T12:01:00Z" },
      ]),
    })
  ) as jest.Mock;
});

afterAll(() => {
  // @ts-expect-error: Jest global fetch mock type mismatch
  global.fetch.mockClear();
  // @ts-expect-error: Jest global fetch mock type mismatch for delete
  delete (global.fetch as typeof global.fetch | undefined);
});

describe("RecentLogsTable", () => {
  it("renders logs and filters by search", async () => {
    render(<RecentLogsTable />);
    await waitFor(() => {
      const aCells = screen.getAllByText("Log message A");
      expect(aCells.some(cell => cell.tagName === "TD")).toBe(true);
      const bCells = screen.getAllByText("Log message B");
      expect(bCells.some(cell => cell.tagName === "TD")).toBe(true);
    });

    // Search filter (use a more specific term)
    const searchInput = screen.getByPlaceholderText("Search by Log ID or Message");
    fireEvent.change(searchInput, { target: { value: "Log message A" } });
    await waitFor(() => {
      // Wait for only one row to be present
      const rows = screen.getAllByRole("row");
      // 1 header + 1 filtered row
      expect(rows.length).toBe(2);
      const aCells = screen.getAllByText("Log message A");
      expect(aCells.some(cell => cell.tagName === "TD")).toBe(true);
      const bCells = screen.queryAllByText("Log message B");
      expect(bCells.filter(cell => cell.tagName === "TD")).toHaveLength(0);
    });
  });

  it("shows error message on fetch failure", async () => {
    // @ts-expect-error: Jest global fetch mock type mismatch for implementationOnce
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) }));
    render(<RecentLogsTable />);
    await waitFor(() => {
      expect(screen.getByText(/Error loading logs/i)).toBeInTheDocument();
    });
  });
});
