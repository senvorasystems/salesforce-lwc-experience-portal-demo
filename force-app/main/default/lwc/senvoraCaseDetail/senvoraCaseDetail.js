import { LightningElement, api, wire } from "lwc";
import { getFieldValue, getRecord } from "lightning/uiRecordApi";
import CASE_NUMBER_FIELD from "@salesforce/schema/Case.CaseNumber";
import SUBJECT_FIELD from "@salesforce/schema/Case.Subject";
import STATUS_FIELD from "@salesforce/schema/Case.Status";
import PRIORITY_FIELD from "@salesforce/schema/Case.Priority";
import ORIGIN_FIELD from "@salesforce/schema/Case.Origin";
import DESCRIPTION_FIELD from "@salesforce/schema/Case.Description";
import CREATED_DATE_FIELD from "@salesforce/schema/Case.CreatedDate";

const CASE_FIELDS = [
  CASE_NUMBER_FIELD,
  SUBJECT_FIELD,
  STATUS_FIELD,
  PRIORITY_FIELD,
  ORIGIN_FIELD,
  DESCRIPTION_FIELD,
  CREATED_DATE_FIELD
];

export default class SenvoraCaseDetail extends LightningElement {
  _recordId;
  record;
  hasError = false;
  isLoading = false;

  @api
  get recordId() {
    return this._recordId;
  }

  set recordId(value) {
    if (value === this._recordId) {
      return;
    }

    this._recordId = value;
    this.record = undefined;
    this.hasError = false;
    this.isLoading = Boolean(value);
  }

  @wire(getRecord, { recordId: "$_recordId", fields: CASE_FIELDS })
  wiredCase({ data, error }) {
    if (!this._recordId) {
      this.record = undefined;
      this.hasError = false;
      this.isLoading = false;
    } else if (data) {
      this.record = data;
      this.hasError = false;
      this.isLoading = false;
    } else if (error) {
      this.record = undefined;
      this.hasError = true;
      this.isLoading = false;
    } else {
      this.record = undefined;
      this.hasError = false;
      this.isLoading = true;
    }
  }

  get showNoSelection() {
    return !this._recordId;
  }

  get hasRecord() {
    return Boolean(this.record);
  }

  get caseNumber() {
    return getFieldValue(this.record, CASE_NUMBER_FIELD);
  }

  get subject() {
    return getFieldValue(this.record, SUBJECT_FIELD);
  }

  get status() {
    return getFieldValue(this.record, STATUS_FIELD);
  }

  get priority() {
    return getFieldValue(this.record, PRIORITY_FIELD);
  }

  get origin() {
    return getFieldValue(this.record, ORIGIN_FIELD);
  }

  get createdDate() {
    return getFieldValue(this.record, CREATED_DATE_FIELD);
  }

  get description() {
    const value = getFieldValue(this.record, DESCRIPTION_FIELD);
    return value && value.trim() ? value : "No description provided.";
  }
}
