import { createElement } from "lwc";
import SenvoraServicePortal from "c/senvoraServicePortal";

const CASE_A_ID = "500000000000001AAA";
const CASE_B_ID = "500000000000002AAA";
const flushPromises = () => Promise.resolve();

function createComponent() {
  const element = createElement("c-senvora-service-portal", {
    is: SenvoraServicePortal
  });
  document.body.appendChild(element);
  return element;
}

function selectCase(workspace, caseId) {
  workspace.dispatchEvent(
    new CustomEvent("caseselected", { detail: { caseId } })
  );
}

describe("c-senvora-service-portal", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("composes Workspace, Detail, and Create", () => {
    const element = createComponent();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-workspace")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("c-senvora-case-detail")
    ).not.toBeNull();
    expect(
      element.shadowRoot.querySelector("c-senvora-case-create")
    ).not.toBeNull();
  });

  it("starts without a selected Case", () => {
    const element = createComponent();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-detail").recordId
    ).toBeUndefined();
  });

  it("passes caseselected to Detail", async () => {
    const element = createComponent();
    const workspace = element.shadowRoot.querySelector(
      "c-senvora-case-workspace"
    );

    selectCase(workspace, CASE_A_ID);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-detail").recordId
    ).toBe(CASE_A_ID);
  });

  it("updates Detail after a second selection", async () => {
    const element = createComponent();
    const workspace = element.shadowRoot.querySelector(
      "c-senvora-case-workspace"
    );
    selectCase(workspace, CASE_A_ID);
    await flushPromises();

    selectCase(workspace, CASE_B_ID);
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-detail").recordId
    ).toBe(CASE_B_ID);
  });

  it("refreshes Workspace exactly once after casecreated", () => {
    const element = createComponent();
    const workspace = element.shadowRoot.querySelector(
      "c-senvora-case-workspace"
    );
    const refreshSpy = jest
      .spyOn(workspace, "refreshCases")
      .mockResolvedValue();

    element.shadowRoot
      .querySelector("c-senvora-case-create")
      .dispatchEvent(new CustomEvent("casecreated"));

    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("preserves selectedCaseId after casecreated", async () => {
    const element = createComponent();
    const workspace = element.shadowRoot.querySelector(
      "c-senvora-case-workspace"
    );
    jest.spyOn(workspace, "refreshCases").mockResolvedValue();
    selectCase(workspace, CASE_A_ID);
    await flushPromises();

    element.shadowRoot
      .querySelector("c-senvora-case-create")
      .dispatchEvent(new CustomEvent("casecreated"));
    await flushPromises();

    expect(
      element.shadowRoot.querySelector("c-senvora-case-detail").recordId
    ).toBe(CASE_A_ID);
  });
});
