const request = require('request-promise');
const {TrackData} = require('../models/trackData'),
	convert = require('xml-js').xml2json;
exports.search = async (req, res) => {

	try{
		const data = await TrackData.findOne({partId: req.query.partId}).populate('techName')
		if(!data) throw new Error('No data is found')
		const url =`http://production.shippingapis.com/ShippingApi.dll?API=TrackV2&XML=%3CTrackFieldRequest%20USERID=%22${process.env.USPS_ID}%22%3E%3CTrackID%20ID=%22${data.trackCode}%22%3E%3C/TrackID%3E%3C/TrackFieldRequest%3E`
		let xml = await request(url);
		let parsedXML = JSON.parse(convert(xml, {compact: true, spaces: 4})).TrackResponse.TrackInfo;
		let startEvent = parsedXML.TrackDetail.pop();
		let lastEvent = parsedXML.TrackDetail[0]
		let body = {
			...data._doc,
			startDate: startEvent.EventDate._text + " " + startEvent.EventTime._text,
			lastDate: lastEvent.EventDate._text + " " + lastEvent.EventTime._text,
			eventText: lastEvent.Event._text
		}
		res.send(body)
	}catch(e){
		console.log(e);
	}
}