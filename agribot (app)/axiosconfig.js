import axios from "axios"



const axiosinstance = axios.create({
    baseURL: "http://raspberrypi.local:5000",
})

export default axiosinstance;