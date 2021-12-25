import { LightningElement, api, wire } from "lwc";
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import { publish, MessageContext } from "lightning/messageService";
import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

// const columns = [
//     { label: 'Name', fieldName: 'Name', editable: true },
//     { label: 'Length', fieldName: 'Length__c', editable: true },
//     { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
//     { label: 'Description', fieldName: 'Description__c', editable: true },
// ];

export default class BoatSearchResults extends LightningElement {
    selectedBoatId;
    columns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Length', fieldName: 'Length__c', editable: true },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true },
        { label: 'Description', fieldName: 'Description__c', editable: true }
    ];

    boatTypeId = '';
    boats;
    isLoading = false;
    draftValues = {};

    // wired message context
    @wire(MessageContext)
    messageContext;
    // wired getBoats method 
    @wire(getBoats, {boatTypeId: '$boatTypeId'})
    wiredBoats({ error, data }) {
        if (data) {
            this.boats = data;
            console.dir('this.boats: ' + this.boats);
            console.dir(this.boats);
            this.notifyLoading(false);
        } else if (error) {
            console.dir(error);
        }
    }

    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        console.log('Inside boatSearchResults: ' + boatTypeId);
        this.boatTypeId = boatTypeId;
        this.notifyLoading(true);
    }

    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api
    async refresh() {
        refreshApex(this.boats);
        this.notifyLoading(false);
    }

    // this function must update selectedBoatId and call sendMessageService
    updateSelectedTile(event) {
        console.log('selected boat has changed via tile');
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId)
    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) {
        // explicitly pass boatId to the parameter recordId
        let payload = { recordId: boatId };
        console.log('publishing payload: ' + payload);
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
        console.dir(event.detail.draftValues);
        // Update the records via Apex
        this.notifyLoading(true);
        updateBoatList({ data: updatedFields })
            .then((result) => {
                const toastEvent = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    variant: SUCCESS_VARIANT,
                    message: MESSAGE_SHIP_IT
                })
                this.refresh();
                this.dispatchEvent(toastEvent);
                this.draftValues = null;
            })
            .catch(error => {
                console.dir(JSON.stringify(error));
                const toastEvent = new ShowToastEvent({
                    title: ERROR_TITLE,
                    variant: ERROR_VARIANT,
                    message: error
                })
                this.dispatchEvent(toastEvent);
                this.notifyLoading(false);
            })
            .finally(() => { });
    }
    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) {
        let event = null;
        if(isLoading) {
            event = new CustomEvent('loading');
        } else {
            event = new CustomEvent('doneloading');
        }
        this.dispatchEvent(event);
    }
}
