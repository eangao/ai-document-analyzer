import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileUpload } from "@/components/FileUpload";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("FileUpload", () => {
  const onUploadStart = vi.fn();
  const onExtractComplete = vi.fn();
  const onAnalysisComplete = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a drop zone with instructions", () => {
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );
    expect(screen.getByText(/drag.*drop.*pdf/i)).toBeInTheDocument();
  });

  it("renders a file input that accepts PDFs", () => {
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );
    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input).toHaveAttribute("accept", "application/pdf");
  });

  it("renders a clickable browse button", () => {
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );
    expect(screen.getByRole("button", { name: /browse/i })).toBeInTheDocument();
  });

  it("rejects non-PDF files", () => {
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const input = screen.getByTestId("file-input");

    // Use fireEvent directly since userEvent.upload respects accept attribute
    fireEvent.change(input, { target: { files: [file] } });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "extraction",
        message: "Invalid file type. Only PDF files are accepted.",
        isDemoLimit: false,
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects files larger than 10MB", async () => {
    const user = userEvent.setup();
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    // Create a file > 10MB
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const file = new File([largeContent], "large.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "extraction",
        message: "File size exceeds the 10MB limit.",
        isDemoLimit: false,
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls onUploadStart when a valid file is selected", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "extracted text", pageCount: 1, title: "test" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ summary: "test", documentType: "contract" }),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    expect(onUploadStart).toHaveBeenCalledOnce();
  });

  it("calls /api/extract then /api/analyze on valid upload", async () => {
    const user = userEvent.setup();
    const extractResponse = { text: "extracted text", pageCount: 3, title: "Test Doc" };
    const analysisResponse = { summary: "test summary", documentType: "contract" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(extractResponse),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(analysisResponse),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    // First call should be to /api/extract with FormData
    expect(mockFetch.mock.calls[0][0]).toBe("/api/extract");
    expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");

    // Second call should be to /api/analyze with JSON body
    expect(mockFetch.mock.calls[1][0]).toBe("/api/analyze");
    expect(mockFetch.mock.calls[1][1]?.method).toBe("POST");
  });

  it("calls onExtractComplete after successful extraction", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "extracted text", pageCount: 1, title: "test" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ summary: "test" }),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onExtractComplete).toHaveBeenCalledOnce();
    });
  });

  it("calls onAnalysisComplete with analysis data on success", async () => {
    const user = userEvent.setup();
    const analysisData = { summary: "test summary", documentType: "contract" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "extracted text", pageCount: 1, title: "test" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(analysisData),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onAnalysisComplete).toHaveBeenCalledWith(analysisData);
    });
  });

  it("calls onError when extract API returns an error", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "PDF extraction failed" }),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "extraction",
          message: "PDF extraction failed",
        })
      );
    });
  });

  it("calls onError when analyze API returns an error", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: "extracted text", pageCount: 1, title: "test" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Analysis failed" }),
    });

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "analysis",
          message: "Analysis failed",
        })
      );
    });
  });

  it("calls onError on network failure", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "network",
          message: "Network error. Please check your connection and try again.",
        })
      );
    });
  });

  it("is disabled while processing", async () => {
    render(
      <FileUpload
        onUploadStart={onUploadStart}
        onExtractComplete={onExtractComplete}
        onAnalysisComplete={onAnalysisComplete}
        onError={onError}
        disabled={true}
      />
    );

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
