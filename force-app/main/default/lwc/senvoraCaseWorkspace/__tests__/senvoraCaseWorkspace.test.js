import { createElement } from "lwc";
import SenvoraCaseWorkspace from "c/senvoraCaseWorkspace";
import getCases from "@salesforce/apex/ServicePortalCaseController.getCases";
import { refreshApex } from "@salesforce/apex";

jest.mock(
  "@salesforce/apex/ServicePortalCaseController.getCases",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

jest.mock(
  "@salesforce/apex",
  () => ({
    refreshApex: jest.fn(() => Promise.resolve())
  }),
  { virtual: true }
);

const CASES = [
  {
    id: "500000000000001AAA",
    caseNumber: "00001001",
    subject: "Unable to sign in",
    status: "New",
    priority: "High",
    createdDate: "2026-08-28T08:00:00.000Z"
  },
  {
    id: "500000000000002AAA",
    caseNumber: "00001002",
    subject: "Billing question",
    status: "Working",
    priority: "Medium",
    createdDate: "2026-08-28T09:00:00.000Z"
  }
];

const flushPromises = () => Promise.resolve();

function createComponent() {
  const element = createElement("c-senvora-case-workspace", {
    is: SenvoraCaseWorkspace
  });
  document.body.appendChild(element);
  return element;
}

describe("c-senvora-case-workspace", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.clearAllMocks();
  });

  it("renders Case filters and the initial loading state", () => {
    const element = createComponent();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-filters")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("lightning-spinner").alternativeText
    ).toBe("Loading cases");
    expect(element.shadowRoot.querySelector("c-senvora-case-list")).toBeNull();
  });

  it("renders and passes Apex results to Case List", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();

    const caseList = element.shadowRoot.querySelector("c-senvora-case-list");
    expect(caseList).not.toBeNull();
    expect(caseList.cases).toEqual(CASES);
    expect(element.shadowRoot.querySelector("lightning-spinner")).toBeNull();
  });

  it("updates reactive Apex parameters after filterchange", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();

    element.shadowRoot.querySelector("c-senvora-case-filters").dispatchEvent(
      new CustomEvent("filterchange", {
        detail: { searchTerm: "login", status: "New", priority: "High" }
      })
    );
    await flushPromises();

    expect(getCases.getLastConfig()).toEqual({
      searchTerm: "login",
      status: "New",
      priority: "High"
    });
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
    expect(element.shadowRoot.querySelector("c-senvora-case-list")).toBeNull();
  });

  it("shows the unfiltered empty state", async () => {
    const element = createComponent();
    getCases.emit([]);
    await flushPromises();

    const status = element.shadowRoot.querySelector('[role="status"]');
    expect(status.textContent).toContain("No cases are available.");
    expect(element.shadowRoot.querySelector("c-senvora-case-list")).toBeNull();
  });

  it("shows the filtered empty state", async () => {
    const element = createComponent();
    element.shadowRoot.querySelector("c-senvora-case-filters").dispatchEvent(
      new CustomEvent("filterchange", {
        detail: { searchTerm: "missing", status: "", priority: "" }
      })
    );
    await flushPromises();
    getCases.emit([]);
    await flushPromises();

    const status = element.shadowRoot.querySelector('[role="status"]');
    expect(status.textContent).toContain("No cases match the current filters.");
  });

  it("shows a safe Apex error and removes previous data", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();
    expect(
      element.shadowRoot.querySelector("c-senvora-case-list")
    ).not.toBeNull();

    getCases.error({ message: "Sensitive internal exception" });
    await flushPromises();

    const alert = element.shadowRoot.querySelector('[role="alert"]');
    expect(alert.textContent).toContain("Cases are temporarily unavailable.");
    expect(alert.textContent).not.toContain("Sensitive internal exception");
    expect(element.shadowRoot.querySelector("c-senvora-case-list")).toBeNull();
  });

  it("owns selection and emits caseselected", async () => {
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("caseselected", handler);
    getCases.emit(CASES);
    await flushPromises();
    const caseList = element.shadowRoot.querySelector("c-senvora-case-list");

    caseList.dispatchEvent(
      new CustomEvent("caseselect", { detail: { caseId: CASES[1].id } })
    );
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-list").selectedCaseId
    ).toBe(CASES[1].id);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ caseId: CASES[1].id });
  });

  it("clears selection when the selected Case is no longer visible", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();
    element.shadowRoot
      .querySelector("c-senvora-case-list")
      .dispatchEvent(
        new CustomEvent("caseselect", { detail: { caseId: CASES[0].id } })
      );
    await flushPromises();

    getCases.emit([CASES[1]]);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-list").selectedCaseId
    ).toBeUndefined();
  });

  it("refreshes Apex after the wire has resolved", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();

    await element.refreshCases();

    expect(refreshApex).toHaveBeenCalledTimes(1);
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
  });

  it("does not refresh while a reactive filter query is pending", async () => {
    const element = createComponent();
    getCases.emit(CASES);
    await flushPromises();

    element.shadowRoot.querySelector("c-senvora-case-filters").dispatchEvent(
      new CustomEvent("filterchange", {
        detail: { searchTerm: "billing", status: "", priority: "" }
      })
    );
    await flushPromises();

    await element.refreshCases();
    expect(refreshApex).not.toHaveBeenCalled();

    getCases.emit([CASES[1]]);
    await flushPromises();
    await element.refreshCases();

    expect(refreshApex).toHaveBeenCalledTimes(1);
  });

  it("safely ignores refresh before the wire has resolved", async () => {
    const element = createComponent();

    await expect(element.refreshCases()).resolves.toBeUndefined();
    expect(refreshApex).not.toHaveBeenCalled();
  });
});
