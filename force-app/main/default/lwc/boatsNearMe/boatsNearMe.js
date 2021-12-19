// imports
import { LightningElement, wire, track, api } from "lwc";
import getBoatsByLocation from "@salesforce/apex/BoatDataService.getBoatsByLocation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
const LABEL_YOU_ARE_HERE = "You are here!";
const ICON_STANDARD_USER = "standard:user";
const ERROR_TITLE = "Error loading Boats Near Me";
const ERROR_VARIANT = "error";

export default class BoatsNearMe extends LightningElement {
	@api boatTypeId = "";
	@track mapMarkers = [];
	isLoading = true;
	isRendered = false;
	latitude;
	longitude;

	// Add the wired method from the Apex Class
	// Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
	// Handle the result and calls createMapMarkers
	@wire(getBoatsByLocation, {
		latitude: "$latitude",
		longitude: "$longitude",
		boatTypeId: "$boatTypeId"
	})
	wiredBoatsJSON({ error, data }) {
		if (data) {
			console.log("HERE!");
			console.dir(JSON.parse(data));
			this.createMapMarkers(JSON.parse(data));
			this.isLoading = false;
		} else if (error) {
			console.dir(error);
			const evt = new ShowToastEvent({
				title: ERROR_TITLE,
				message: error,
				variant: ERROR_VARIANT
			});
			this.dispatchEvent(evt);
			this.isLoading = false;
		}
	}

	// Controls the isRendered property
	// Calls getLocationFromBrowser()
	renderedCallback() {
		if (!this.isRendered) {
			this.getLocationFromBrowser();
			this.isRendered = true;
		}
	}

	// Gets the location from the Browser
	// position => {latitude and longitude}
	getLocationFromBrowser() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				this.longitude = position.coords.longitude;
				this.latitude = position.coords.latitude;

				console.log(this.longitude);
				console.log(this.latitude);
			});
		}
	}

	// Creates the map markers
	createMapMarkers(boatData) {
		// const newMarkers = boatData.map(boat => {...});
		// newMarkers.unshift({...});
		const newMarkers = boatData.map((boat) => {
			return {
				title: boat.Name,
				location: {
					Latitude: boat.Geolocation__Latitude__s,
					Longitude: boat.Geolocation__Longitude__s
				}
			};
		});
		console.dir(newMarkers);
		newMarkers.unshift({
			title: LABEL_YOU_ARE_HERE,
			icon: ICON_STANDARD_USER,
			location: {
				Longitude: this.longitude,
				Latitude: this.latitude
			}
		});
		console.dir(newMarkers);
		this.mapMarkers = newMarkers;
	}
}
