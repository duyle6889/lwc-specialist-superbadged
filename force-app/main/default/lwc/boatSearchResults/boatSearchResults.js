import { wire, LightningElement, api } from 'lwc';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import {
    MessageContext,
    publish
} from "lightning/messageService";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import NAME_FIELD from '@salesforce/schema/Boat__c.Name';
import PRICE_FIELD from '@salesforce/schema/Boat__c.Price__c';
import LENGTH_FIELD from '@salesforce/schema/Boat__c.Length__c';
import DESC_FIELD from '@salesforce/schema/Boat__c.Description__c';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';
export default class BoatSearchResults extends LightningElement {
    selectedBoatId;
    columns = [
        {
            label: "Name",
            fieldName: NAME_FIELD.fieldApiName,
            editable: true
        },
        {
            label: "Length",
            fieldName: LENGTH_FIELD.fieldApiName,
            type: "number"
        },
        {
            label: "Price",
            fieldName: PRICE_FIELD.fieldApiName,
            type: "currency"
        },
        {
            label: "Description",
            fieldName: DESC_FIELD.fieldApiName
        }
    ];
    boatTypeId = '';
    boats;
    isLoading = false;
    draftValues = [];

    // wired message context
    @wire(MessageContext)
    messageContext;

    // wired getBoats method
    @wire(getBoats, {boatTypeId: '$boatTypeId'})
    wiredBoats(result) {
        if (result.data) {
            this.boats = result.data;
        } else if (result.error) {
            console.error("error message: " + result.error);
        }
    }

    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        this.isLoading = true;
        this.boatTypeId = boatTypeId;
        this.notifyLoading(this.isLoading);
    }

    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api
    async refresh() {
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        await refreshApex(this.boats);
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }

    // this function must update selectedBoatId and call sendMessageService
    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(event.detail.boatId);
    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) {
        // explicitly pass boatId to the parameter recordId
        const payload = { recordId: boatId };
        publish(this.messageContext, BOATMC, payload);
    }

    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // clear lightning-datatable draft values
    handleSave(event) {
        // notify loading
        const updatedFields = event.detail.draftValues;
        // Update the records via Apex
        updateBoatList({ boatsData: updatedFields })
            .then(() => {
                const successEvent = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT,
                });
                this.dispatchEvent(successEvent);
            })
            .catch(error => {
                const errorEvent = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.message,
                    variant: ERROR_VARIANT,
                });
                this.dispatchEvent(errorEvent);
            })
            .finally(() => {
                this.draftValues = [];
                return this.refresh();
            });
    }

    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) {
        if (isLoading) {
            this.dispatchEvent(new CustomEvent('loading'));
        } else {
            this.dispatchEvent(new CustomEvent('doneloading'));
        }
    }
}
