import { createElement } from "lwc";
import SenvoraCaseCreate from "c/senvoraCaseCreate";

const CASE_ID = "500000000000001AAA";
const flushPromises = () => Promise.resolve();

function createComponent() {
  const element = createElement("c-senvora-case-create", {
    is: SenvoraCaseCreate
  });
  document.body.appendChild(element);
  return element;
}

function submit(form) {
  const event = new CustomEvent("submit", {
    cancelable: true,
    detail: { fields: {} }
  });
  form.dispatchEvent(event);
  return event;
}

describe("c-senvora-case-create", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders the LDS form and required field set", () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");
    const fields = element.shadowRoot.querySelectorAll("lightning-input-field");

    expect(form).not.toBeNull();
    expect(form.objectApiName.objectApiName).toBe("Case");
    expect(
      Array.from(fields, (field) => ({
        objectApiName: field.fieldName.objectApiName,
        fieldApiName: field.fieldName.fieldApiName
      }))
    ).toEqual([
      { objectApiName: "Case", fieldApiName: "Subject" },
      { objectApiName: "Case", fieldApiName: "Description" },
      { objectApiName: "Case", fieldApiName: "Origin" },
      { objectApiName: "Case", fieldApiName: "Priority" }
    ]);
  });

  it("starts with the Create case button enabled", () => {
    const element = createComponent();

    expect(element.shadowRoot.querySelector("lightning-button").disabled).toBe(
      false
    );
  });

  it("shows submitting state and disables the button", async () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");

    submit(form);
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-button").disabled).toBe(
      true
    );
    expect(
      element.shadowRoot.querySelector("lightning-spinner").alternativeText
    ).toBe("Creating case");
  });

  it("prevents a duplicate submit while already submitting", async () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");

    const firstSubmit = submit(form);
    await flushPromises();
    const duplicateSubmit = submit(form);

    expect(firstSubmit.defaultPrevented).toBe(false);
    expect(duplicateSubmit.defaultPrevented).toBe(true);
    expect(
      element.shadowRoot.querySelectorAll("lightning-spinner")
    ).toHaveLength(1);
  });

  it("handles success and emits casecreated with the new Case ID", async () => {
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("casecreated", handler);
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");
    submit(form);

    form.dispatchEvent(new CustomEvent("success", { detail: { id: CASE_ID } }));
    await flushPromises();

    expect(element.shadowRoot.querySelector("lightning-button").disabled).toBe(
      false
    );
    expect(element.shadowRoot.textContent).toContain(
      "Case created successfully."
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ caseId: CASE_ID });
  });

  it("resets every field after success", () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");
    const fields = element.shadowRoot.querySelectorAll("lightning-input-field");
    const resetSpies = Array.from(fields, (field) =>
      jest.spyOn(field, "reset")
    );

    form.dispatchEvent(new CustomEvent("success", { detail: { id: CASE_ID } }));

    resetSpies.forEach((resetSpy) => expect(resetSpy).toHaveBeenCalledTimes(1));
  });

  it("shows only a safe error and re-enables the button", async () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");
    submit(form);

    form.dispatchEvent(
      new CustomEvent("error", {
        detail: { message: "Sensitive LDS error", errorCode: "INTERNAL_ERROR" }
      })
    );
    await flushPromises();

    const alert = element.shadowRoot.querySelector('[role="alert"]');
    expect(alert.textContent).toContain(
      "Case could not be created. Please try again."
    );
    expect(element.shadowRoot.textContent).not.toContain("Sensitive LDS error");
    expect(element.shadowRoot.textContent).not.toContain("INTERNAL_ERROR");
    expect(element.shadowRoot.querySelector("lightning-button").disabled).toBe(
      false
    );
  });

  it("allows another submit after an error", async () => {
    const element = createComponent();
    const form = element.shadowRoot.querySelector("lightning-record-edit-form");
    submit(form);
    form.dispatchEvent(
      new CustomEvent("error", { detail: { message: "Failure" } })
    );
    await flushPromises();

    const retrySubmit = submit(form);
    await flushPromises();

    expect(retrySubmit.defaultPrevented).toBe(false);
    expect(
      element.shadowRoot.querySelector("lightning-spinner")
    ).not.toBeNull();
    expect(element.shadowRoot.querySelector('[role="alert"]')).toBeNull();
  });
});
