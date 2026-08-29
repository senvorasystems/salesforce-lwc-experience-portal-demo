import { createElement } from "lwc";
import SenvoraCaseList from "c/senvoraCaseList";

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

function createComponent(cases = CASES) {
  const element = createElement("c-senvora-case-list", {
    is: SenvoraCaseList
  });
  element.cases = cases;
  document.body.appendChild(element);
  return element;
}

describe("c-senvora-case-list", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders multiple Case summaries", () => {
    const element = createComponent();
    const cards = element.shadowRoot.querySelectorAll(".case-card");

    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain("00001001");
    expect(cards[0].textContent).toContain("Unable to sign in");
    expect(cards[0].textContent).toContain("New");
    expect(cards[0].textContent).toContain("High");
  });

  it("uses native buttons for interactive Case cards", () => {
    const element = createComponent();
    const cards = element.shadowRoot.querySelectorAll(".case-card");

    cards.forEach((card) => {
      expect(card.tagName).toBe("BUTTON");
      expect(card.getAttribute("type")).toBe("button");
    });
  });

  it("renders the empty state", () => {
    const element = createComponent([]);

    expect(element.shadowRoot.querySelectorAll(".case-card")).toHaveLength(0);
    expect(
      element.shadowRoot.querySelector('[role="status"]').textContent
    ).toContain("No cases found.");
  });

  it("emits caseselect with the Case ID when clicked", () => {
    const element = createComponent();
    const handler = jest.fn();
    element.addEventListener("caseselect", handler);

    element.shadowRoot.querySelector(".case-card").click();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ caseId: CASES[0].id });
  });

  it("reflects selectedCaseId through text and aria-pressed", () => {
    const element = createElement("c-senvora-case-list", {
      is: SenvoraCaseList
    });
    element.cases = CASES;
    element.selectedCaseId = CASES[1].id;
    document.body.appendChild(element);

    const cards = element.shadowRoot.querySelectorAll(".case-card");
    expect(cards[0].getAttribute("aria-pressed")).toBe("false");
    expect(cards[1].getAttribute("aria-pressed")).toBe("true");
    expect(cards[1].textContent).toContain("Selected");
    expect(cards[1].classList).toContain("case-card_selected");
  });
});
