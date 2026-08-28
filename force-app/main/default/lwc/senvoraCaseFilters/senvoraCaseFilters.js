import { LightningElement, wire } from "lwc";
import { getObjectInfo, getPicklistValues } from "lightning/uiObjectInfoApi";
import CASE_OBJECT from "@salesforce/schema/Case";
import STATUS_FIELD from "@salesforce/schema/Case.Status";
import PRIORITY_FIELD from "@salesforce/schema/Case.Priority";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_STATUSES_OPTION = { label: "All statuses", value: "" };
const ALL_PRIORITIES_OPTION = { label: "All priorities", value: "" };

export default class SenvoraCaseFilters extends LightningElement {
  searchTerm = "";
  status = "";
  priority = "";

  objectInfoData;
  objectInfoError;
  statusData;
  statusError;
  priorityData;
  priorityError;
  searchTimer;

  @wire(getObjectInfo, { objectApiName: CASE_OBJECT })
  wiredObjectInfo({ data, error }) {
    if (data) {
      this.objectInfoData = data;
      this.objectInfoError = undefined;
    } else if (error) {
      this.objectInfoData = undefined;
      this.objectInfoError = error;
    }
  }

  @wire(getPicklistValues, {
    recordTypeId: "$defaultRecordTypeId",
    fieldApiName: STATUS_FIELD
  })
  wiredStatusValues({ data, error }) {
    if (data) {
      this.statusData = data;
      this.statusError = undefined;
    } else if (error) {
      this.statusData = undefined;
      this.statusError = error;
    }
  }

  @wire(getPicklistValues, {
    recordTypeId: "$defaultRecordTypeId",
    fieldApiName: PRIORITY_FIELD
  })
  wiredPriorityValues({ data, error }) {
    if (data) {
      this.priorityData = data;
      this.priorityError = undefined;
    } else if (error) {
      this.priorityData = undefined;
      this.priorityError = error;
    }
  }

  get defaultRecordTypeId() {
    return this.objectInfoData?.defaultRecordTypeId;
  }

  get metadataError() {
    return this.objectInfoError || this.statusError || this.priorityError;
  }

  get metadataLoading() {
    return (
      !this.metadataError &&
      (!this.objectInfoData || !this.statusData || !this.priorityData)
    );
  }

  get controlsDisabled() {
    return this.metadataLoading || Boolean(this.metadataError);
  }

  get statusOptions() {
    return [ALL_STATUSES_OPTION, ...this.toOptions(this.statusData)];
  }

  get priorityOptions() {
    return [ALL_PRIORITIES_OPTION, ...this.toOptions(this.priorityData)];
  }

  handleSearchChange(event) {
    this.searchTerm = event.target.value;
    this.clearSearchTimer();
    // A short timer prevents a server request for every search keystroke in the future workspace.
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.searchTimer = setTimeout(() => {
      this.searchTimer = undefined;
      this.dispatchFilterChange();
    }, SEARCH_DEBOUNCE_MS);
  }

  handleStatusChange(event) {
    this.clearSearchTimer();
    this.status = event.detail.value;
    this.dispatchFilterChange();
  }

  handlePriorityChange(event) {
    this.clearSearchTimer();
    this.priority = event.detail.value;
    this.dispatchFilterChange();
  }

  handleClear() {
    this.clearSearchTimer();
    this.searchTerm = "";
    this.status = "";
    this.priority = "";
    this.dispatchFilterChange();
  }

  disconnectedCallback() {
    this.clearSearchTimer();
  }

  dispatchFilterChange() {
    this.dispatchEvent(
      new CustomEvent("filterchange", {
        detail: {
          searchTerm: this.searchTerm.trim(),
          status: this.status,
          priority: this.priority
        }
      })
    );
  }

  clearSearchTimer() {
    if (this.searchTimer !== undefined) {
      clearTimeout(this.searchTimer);
      this.searchTimer = undefined;
    }
  }

  toOptions(picklistData) {
    return (picklistData?.values || []).map(({ label, value }) => ({
      label,
      value
    }));
  }
}
