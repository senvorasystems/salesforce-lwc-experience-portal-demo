import { createElement } from "lwc";
import SenvoraCaseFilters from "c/senvoraCaseFilters";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";

const flushPromises = () => Promise.resolve();

const OBJECT_INFO = {
  defaultRecordTypeId: "012000000000000AAA"
};

const PICKLIST_VALUES = {
  values: [
    { label: "New", value: "New" },
    { label: "Closed", value: "Closed" }
  ]
};

function createComponent() {
  const element = createElement("c-senvora-case-filters", {
    is: SenvoraCaseFilters
  });
  document.body.appendChild(element);
  return element;
}

async function loadMetadata() {
  getObjectInfo.emit(OBJECT_INFO);
  await flushPromises();
  getPicklistValues.emit(PICKLIST_VALUES);
  await flushPromises();
}

describe("c-senvora-case-filters", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    jest.useRealTimers();
  });

  it("renders labeled search and filter controls", () => {
    const element = createComponent();

    const search = element.shadowRoot.querySelector("lightning-input");
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");

    expect(search.label).toBe("Search cases");
    expect(comboboxes).toHaveLength(2);
    expect(comboboxes[0].label).toBe("Status");
    expect(comboboxes[1].label).toBe("Priority");
  });

  it("loads picklist options from UI API", async () => {
    const element = createComponent();
    await loadMetadata();

    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");
    expect(comboboxes[0].options).toEqual([
      { label: "All statuses", value: "" },
      ...PICKLIST_VALUES.values
    ]);
    expect(comboboxes[1].options).toEqual([
      { label: "All priorities", value: "" },
      ...PICKLIST_VALUES.values
    ]);
  });

  it("emits filterchange immediately when Status changes", async () => {
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");

    comboboxes[0].dispatchEvent(
      new CustomEvent("change", { detail: { value: "Closed" } })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "",
      status: "Closed",
      priority: ""
    });
  });

  it("emits filterchange immediately when Priority changes", async () => {
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");

    comboboxes[1].dispatchEvent(
      new CustomEvent("change", { detail: { value: "High" } })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "",
      status: "",
      priority: "High"
    });
  });

  it("cancels a pending search event when Status changes", async () => {
    jest.useFakeTimers();
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();

    const search = element.shadowRoot.querySelector("lightning-input");
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");
    search.value = "  login issue  ";
    search.dispatchEvent(new CustomEvent("change"));
    jest.advanceTimersByTime(100);
    comboboxes[0].dispatchEvent(
      new CustomEvent("change", { detail: { value: "Closed" } })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "login issue",
      status: "Closed",
      priority: ""
    });

    jest.advanceTimersByTime(500);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending search event when Priority changes", async () => {
    jest.useFakeTimers();
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();

    const search = element.shadowRoot.querySelector("lightning-input");
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");
    search.value = "billing issue";
    search.dispatchEvent(new CustomEvent("change"));
    jest.advanceTimersByTime(100);
    comboboxes[1].dispatchEvent(
      new CustomEvent("change", { detail: { value: "High" } })
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      searchTerm: "billing issue",
      status: "",
      priority: "High"
    });

    jest.advanceTimersByTime(500);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("debounces search changes", async () => {
    jest.useFakeTimers();
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();
    const search = element.shadowRoot.querySelector("lightning-input");

    search.value = "  login  ";
    search.dispatchEvent(new CustomEvent("change"));
    jest.advanceTimersByTime(299);
    expect(handler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.searchTerm).toBe("login");
  });

  it("clears all filters and cancels a pending search event", async () => {
    jest.useFakeTimers();
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("filterchange", handler);
    await loadMetadata();

    const search = element.shadowRoot.querySelector("lightning-input");
    const comboboxes =
      element.shadowRoot.querySelectorAll("lightning-combobox");
    search.value = "pending";
    search.dispatchEvent(new CustomEvent("change"));
    comboboxes[0].dispatchEvent(
      new CustomEvent("change", { detail: { value: "Closed" } })
    );
    element.shadowRoot.querySelector("lightning-button").click();
    jest.advanceTimersByTime(300);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].detail).toEqual({
      searchTerm: "",
      status: "",
      priority: ""
    });
  });

  it("renders a safe metadata error state", async () => {
    const element = createComponent();
    getObjectInfo.error();
    await flushPromises();

    const alert = element.shadowRoot.querySelector('[role="alert"]');
    expect(alert.textContent).toContain(
      "Case filters are temporarily unavailable."
    );
    expect(element.shadowRoot.querySelector("lightning-input").disabled).toBe(
      true
    );
  });
});
