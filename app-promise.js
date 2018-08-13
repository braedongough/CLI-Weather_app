const yargs = require('yargs')
const axios = require('axios')
const fs = require('fs');

const argv = yargs
    .options({
        a: {
            demandOption: false,
            alias: 'address',
            describe: 'Address to fetch weather for',
            string: true
        },
        d: {
            demandOption: false,
            alias: 'defaultAddress',
            describe: 'Set default address to fetch weather for',
            string: true
        }
    })
    .help()
    .alias('help', 'h')
    .argv

const fetchAddress = () => {
    try {
        const addressString = fs.readFileSync('default-address.json');
        return encodeURIComponent(JSON.parse(addressString));
    } catch (e) {
        return ''
    }
}

const setDefaultAddress = (defaultAddress) => {
    fs.writeFileSync('default-address.json', JSON.stringify(defaultAddress))
}

if (argv.defaultAddress) {
    setDefaultAddress(argv.defaultAddress)
}

const convertToCelcius = (temp) => (temp - 32) * 5 / 9
const encodedAddress = argv.address ? encodeURIComponent(argv.address) : fetchAddress()
const geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=AIzaSyDny-2m_6inybKyJpRdQfc2k2VTmhC4a4g`

axios.get(geocodeURL).then((response) => {
    if (response.data.status === 'ZERO_RESULTS') {
        throw new Error('unable to find that address')
    }

    const lat = response.data.results[0].geometry.location.lat
    const lng = response.data.results[0].geometry.location.lng
    const weatherURL = `https://api.darksky.net/forecast/68215c47100015b946c3325eb5fae59b/${lat},${lng}`
    console.log(response.data.results[0].formatted_address)
    return axios.get(weatherURL)
}).then((response) => {
    const temperature = convertToCelcius(response.data.currently.temperature).toFixed(2)
    const apparentTemperature = convertToCelcius(response.data.currently.apparentTemperature).toFixed(2)
    console.log(`It's currently ${temperature}. It feels like ${apparentTemperature}.`)
}).catch((error) => {
    if (error.code === 'ENOTFOUND') {
        console.log('Unable to connect to servers')
    } else {
        console.log(error.message)
    }
})