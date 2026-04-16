import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Preview from "../../src/components/Preview";

describe("Preview", () => {
  it("Markdownを HTMLにレンダリングする", () => {
    const { container } = render(<Preview content="# Hello" />);
    expect(container.querySelector("h1")).toBeInTheDocument();
  });

  it("コードブロックをレンダリングする", () => {
    const { container } = render(
      <Preview content={"```js\nconsole.log('hi')\n```"} />
    );
    expect(container.querySelector("code")).toBeInTheDocument();
  });
});
