import fetch from 'node-fetch';
import UserSchema from '../models/user';

const url = `https://onesignal.com/api/v1/notifications`;

function sendNotification(userId, notification) {
	UserSchema.findOneAsync({ _id: userId }).then(userObj => {
		if (!userObj) {
			throw new Error('No Such User Exist');
		}
		const App_id =
			userObj.userType === 'rider' ? 'df137503-fb26-4180-aebc-ca6835152506' : '96124b53-6eb7-4fdf-bd98-d188b51e28de';
		const Api_key =
			userObj.userType === 'rider'
				? 'ZDU5ODgzMzUtNDhkYi00N2NhLWEzZjMtYzEzYzg3YjgwOTZm'
				: 'N2Q0YWY0OGQtODRkNi00YjQ3LWE2YzMtOGY3Mzg1YmNmMTMz';
		fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				app_id: App_id,
				contents: { en: notification },
				include_player_ids: [userObj.deviceId], //userObj.deviceId
				data: { source: 'message' }
			}),
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Basic ' + Api_key
			}
		})
			.then(res => res.json())
			.then(data => {
				console.log('RESPONSE', data);
			})
			.catch(err => {
				console.log('ERROR', err);
			});
	});
}
export default sendNotification;
