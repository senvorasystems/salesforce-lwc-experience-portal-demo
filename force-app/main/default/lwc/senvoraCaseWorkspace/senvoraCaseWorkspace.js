import { LightningElement, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getCases from "@salesforce/apex/ServicePortalCaseController.getCases";

export default class SenvoraCaseWorkspace extends LightningElement {
  searchTerm = "";
  status = "";
  priority = "";
  cases = [];
  selectedCaseId;
  isLoading = true;
  hasError = false;

  wiredCasesResult;
  hasResolvedWire = false;

  @wire(getCases, {
    searchTerm: "$searchTerm",
    status: "$status",
    priority: "$priority"
  })
  wiredCases(result) {
    this.wiredCasesResult = result;
    const { data, error } = result;

    if (data) {
      this.cases = data;
      this.hasError = false;
      this.isLoading = false;
      this.hasResolvedWire = true;
      this.reconcileSelection();
    } else if (error) {
      this.cases = [];
      this.hasError = true;
      this.isLoading = false;
      this.hasResolvedWire = true;
      this.selectedCaseId = undefined;
    } else {
      this.cases = [];
      this.hasError = false;
      this.isLoading = true;
      this.hasResolvedWire = false;
    }
  }

  get hasCases() {
    return this.cases.length > 0;
  }

  get hasActiveFilters() {
    return Boolean(this.searchTerm.trim() || this.status || this.priority);
  }

  get emptyStateMessage() {
    return this.hasActiveFilters
      ? "No cases match the current filters."
      : "No cases are available.";
  }

  handleFilterChange(event) {
    const { searchTerm = "", status = "", priority = "" } = event.detail;
    this.searchTerm = searchTerm;
    this.status = status;
    this.priority = priority;
    this.cases = [];
    this.hasError = false;
    this.isLoading = true;
    this.hasResolvedWire = false;
  }

  handleCaseSelect(event) {
    this.selectedCaseId = event.detail.caseId;
    this.dispatchEvent(
      new CustomEvent("caseselected", {
        detail: { caseId: this.selectedCaseId }
      })
    );
  }

  @api
  refreshCases() {
    if (!this.wiredCasesResult || !this.hasResolvedWire) {
      return Promise.resolve();
    }

    this.isLoading = true;
    this.hasError = false;
    return refreshApex(this.wiredCasesResult);
  }

  reconcileSelection() {
    if (
      this.selectedCaseId &&
      !this.cases.some((caseItem) => caseItem.id === this.selectedCaseId)
    ) {
      this.selectedCaseId = undefined;
    }
  }
}
