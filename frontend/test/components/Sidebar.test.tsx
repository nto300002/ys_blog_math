import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../src/components/Sidebar";

const mockTree = {
  folders: [{ id: 1, name: "数学", parent_id: null, created_at: "" }],
  articles: [
    { id: 1, folder_id: 1, title: "CPU入門", slug: "cpu", status: "published" as const },
  ],
};

describe("Sidebar", () => {
  it("フォルダ名が表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar tree={mockTree} />
      </MemoryRouter>
    );
    expect(screen.getByText("数学")).toBeInTheDocument();
  });

  it("フォルダをクリックすると記事が表示される", () => {
    render(
      <MemoryRouter>
        <Sidebar tree={mockTree} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("数学"));
    expect(screen.getByText("CPU入門")).toBeInTheDocument();
  });

  it("currentSlug と一致する記事にactiveクラスが付く", () => {
    render(
      <MemoryRouter>
        <Sidebar tree={mockTree} currentSlug="cpu" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("数学"));
    const item = screen.getByText("CPU入門").closest(".sidebar-item");
    expect(item).toHaveClass("active");
  });
});
