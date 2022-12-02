import { wire, LightningElement } from 'lwc';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import {
  subscribe,
  unsubscribe,
  MessageContext,
  APPLICATION_SCOPE
} from "lightning/messageService";
import { NavigationMixin } from 'lightning/navigation';

// get record data via Lightning Data Service
import { getFieldValue, getRecord } from "lightning/uiRecordApi";

// Custom Labels Imports
// import labelDetails for Details
import labelDetails from "@salesforce/label/c.Details";
// import labelReviews for Reviews
import labelReviews from "@salesforce/label/c.Reviews";
// import labelAddReview for Add_Review
import labelAddReview from "@salesforce/label/c.Add_Review";
// import labelFullDetails for Full_Details
import labelFullDetails from "@salesforce/label/c.Full_Details";
// import labelPleaseSelectABoat for Please_select_a_boat
import labelPleaseSelectABoat from "@salesforce/label/c.Please_select_a_boat";

// Boat__c Schema Imports
import BOAT_OBJECT from '@salesforce/schema/Boat__c';
// import BOAT_ID_FIELD for the Boat Id
import BOAT_ID_FIELD from '@salesforce/schema/Boat__c.Id';
// import BOAT_NAME_FIELD for the boat Name
import BOAT_NAME_FIELD from '@salesforce/schema/Boat__c.Name';
const BOAT_FIELDS = [BOAT_ID_FIELD, BOAT_NAME_FIELD];
export default class BoatDetailTabs extends NavigationMixin(LightningElement) {
  boatId;
  label = {
    labelDetails,
    labelReviews,
    labelAddReview,
    labelFullDetails,
    labelPleaseSelectABoat,
  };
  boatObj = BOAT_OBJECT;

  // Initialize messageContext for Message Service
  @wire(MessageContext)
  messageContext;

  // Decide when to show or hide the icon
  // returns 'utility:anchor' or null
  get detailsTabIconName() {
    return this.wiredRecord != null ? 'utility:anchor' : null;
  }

  // Utilize getFieldValue to extract the boat name from the record wire
  @wire(getRecord, {
    recordId: "$boatId",
    fields: BOAT_FIELDS
  })
  wiredRecord;

  get boatName() {
    return getFieldValue(this.wiredRecord.data, BOAT_NAME_FIELD);
  }

  // Private
  subscription = null;

  // Subscribe to the message channel
  subscribeMC() {
    // local boatId must receive the recordId from the message
    // recordId is populated on Record Pages, and this component
    // should not update when this component is on a record page.
    if (this.subscription) {
      return;
    }
    // Subscribe to the message channel to retrieve the recordId and explicitly assign it to boatId.
    this.subscription = subscribe(
      this.messageContext,
      BOATMC,
      (message) => this.handleMessage(message),
      { scope: APPLICATION_SCOPE }
    );
  }

  // Handler for message received by component
  handleMessage(message) {
    this.boatId = message.recordId;
  }

  //unsubscripte to the message channel
  unsubscribeMC() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  // Calls subscribeMC()
  connectedCallback() {
    this.subscribeMC();
  }

  //call unsubscribeMC
  disconnectedCallback() {
    this.unsubscribeMC();
  }

  // Navigates to record page
  navigateToRecordViewPage() {
    this[NavigationMixin.Navigate]({
      type: 'standard__recordPage',
      attributes: {
        recordId: this.boatId,
        objectApiName: 'Boat__c',
        actionName: 'view'
      }
    });
  }

  // Navigates back to the review list, and refreshes reviews component
  handleReviewCreated() {
    // Navigates back to the review list
    this.template.querySelector('lightning-tabset').activeTabValue = 'Reviews ';
    // refresh boatReviews component via refresh() function
    this.template.querySelector('c-boat-reviews').refresh();
  }
}
