import { createElement } from "lwc";
import SenvoraCaseDetail from "c/senvoraCaseDetail";
import { getRecord } from "lightning/uiRecordApi";

const CASE_A_ID = "500000000000001AAA";
const CASE_B_ID = "500000000000002AAA";
const CREATED_DATE = "2026-08-29T08:30:00.000Z";

const CASE_A = {
  apiName: "Case",
  id: CASE_A_ID,
  fields: {
    CaseNumber: { value: "00001001" },
    Subject: { value: "Unable to sign in" },
    Status: { value: "New" },
    Priority: { value: "High" },
    Origin: { value: "Web" },
    Description: { value: "Customer cannot access the portal." },
    CreatedDate: { value: CREATED_DATE }
  }
};

const CASE_B = {
  apiName: "Case",
  id: CASE_B_ID,
  fields: {
    CaseNumber: { value: "00001002" },
    Subject: { value: "Billing question" },
    Status: { value: "Working" },
    Priority: { value: "Medium" },
    Origin: { value: "Phone" },
    Description: { value: "Customer needs an invoice copy." },
    CreatedDate: { value: "2026-08-29T09:30:00.000Z" }
  }
};

const flushPromises = () => Promise.resolve();

function createComponent(recordId) {
  const element = createElement("c-senvora-case-detail", {
    is: SenvoraCaseDetail
  });
  if (recordId) {
    element.recordId = recordId;
  }
  document.body.appendChild(element);
  return element;
}

describe("c-senvora-case-detail", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("shows the no-selection state without a recordId", () => {
    const element = createComponent();

    expect(
      element.shadowRoot.querySelector('[role="status"]').textContent
    ).toContain("Select a case to view details.");
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
  });

  it("shows loading after recordId is set", async () => {
    const element = createComponent();

    element.recordId = CASE_A_ID;
    await flushPromises();

    const spinner = element.shadowRoot.querySelector("lightning-spinner");
    expect(spinner).not.toBeNull();
    expect(spinner.alternativeText).toBe("Loading case details");
  });

  it("renders all requested Case fields from UI API", async () => {
    const element = createComponent(CASE_A_ID);
    getRecord.emit(CASE_A);
    await flushPromises();

    const content = element.shadowRoot.textContent;
    expect(content).toContain("00001001");
    expect(content).toContain("Unable to sign in");
    expect(content).toContain("New");
    expect(content).toContain("High");
    expect(content).toContain("Web");
    expect(
      element.shadowRoot.querySelector("lightning-formatted-text").value
    ).toBe("Customer cannot access the portal.");
    expect(
      element.shadowRoot.querySelector("lightning-formatted-date-time").value
    ).toBe(CREATED_DATE);
  });

  it("shows a fallback when Description is null", async () => {
    const element = createComponent(CASE_A_ID);
    getRecord.emit({
      ...CASE_A,
      fields: {
        ...CASE_A.fields,
        Description: { value: null }
      }
    });
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("lightning-formatted-text").value
    ).toBe("No description provided.");
  });

  it("shows only a safe UI API error", async () => {
    const element = createComponent(CASE_A_ID);
    getRecord.error({ message: "Sensitive internal UI API message" });
    await flushPromises();

    const alert = element.shadowRoot.querySelector('[role="alert"]');
    expect(alert.textContent).toContain(
      "Case details are temporarily unavailable."
    );
    expect(element.shadowRoot.textContent).not.toContain(
      "Sensitive internal UI API message"
    );
    expect(element.shadowRoot.querySelector("dl")).toBeNull();
  });

  it("removes Case A while Case B is loading", async () => {
    const element = createComponent(CASE_A_ID);
    getRecord.emit(CASE_A);
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain("Unable to sign in");

    element.recordId = CASE_B_ID;
    await flushPromises();

    expect(element.shadowRoot.textContent).not.toContain("Unable to sign in");
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();

    getRecord.emit(CASE_B);
    await flushPromises();
    expect(element.shadowRoot.textContent).toContain("Billing question");
  });

  it("returns to no selection when recordId is cleared", async () => {
    const element = createComponent(CASE_A_ID);
    getRecord.emit(CASE_A);
    await flushPromises();

    element.recordId = undefined;
    await flushPromises();

    expect(element.shadowRoot.textContent).toContain(
      "Select a case to view details."
    );
    expect(element.shadowRoot.textContent).not.toContain("Unable to sign in");
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
    expect(element.shadowRoot.querySelector('[role="alert"]')).toBeNull();
  });
});
