import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 52.52,
	"longitude": 13.41,
	"daily": ["weather_code", "temperature_2m_max", "sunrise", "sunset", "sunshine_duration", "daylight_duration", "uv_index_clear_sky_max", "precipitation_hours", "precipitation_sum", "precipitation_probability_max", "wind_speed_10m_max", "wind_gusts_10m_max", "et0_fao_evapotranspiration", "apparent_temperature_min", "apparent_temperature_max", "temperature_2m_min"],
	"hourly": ["temperature_2m", "pressure_msl", "evapotranspiration", "precipitation_probability", "surface_pressure", "cloud_cover", "relative_humidity_2m", "wind_speed_10m", "soil_temperature_6cm", "soil_moisture_0_to_1cm", "wind_direction_10m", "rain", "apparent_temperature", "uv_index", "sunshine_duration", "direct_radiation", "shortwave_radiation", "uv_index_clear_sky"],
	"minutely_15": ["precipitation", "apparent_temperature"],
	"timezone": "Asia/Bangkok",
	"forecast_days": 14,
}
responses = openmeteo.weather_api(url, params = params)

# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")
print(f"Timezone: {response.Timezone()}{response.TimezoneAbbreviation()}")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process minutely_15 data. The order of variables needs to be the same as requested.
minutely_15 = response.Minutely15()
minutely_15_precipitation = minutely_15.Variables(0).ValuesAsNumpy()
minutely_15_apparent_temperature = minutely_15.Variables(1).ValuesAsNumpy()

minutely_15_data = {
	"date": pd.date_range(
		start = pd.to_datetime(minutely_15.Time(), unit = "s", utc = True),
		end =  pd.to_datetime(minutely_15.TimeEnd(), unit = "s", utc = True),
		freq = pd.Timedelta(seconds = minutely_15.Interval()),
		inclusive = "left"
	).tz_convert(response.Timezone().decode())
}

minutely_15_data["precipitation"] = minutely_15_precipitation
minutely_15_data["apparent_temperature"] = minutely_15_apparent_temperature

minutely_15_dataframe = pd.DataFrame(data = minutely_15_data)
print("\nMinutely15 data\n", minutely_15_dataframe)

# Process hourly data. The order of variables needs to be the same as requested.
hourly = response.Hourly()
hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
hourly_pressure_msl = hourly.Variables(1).ValuesAsNumpy()
hourly_evapotranspiration = hourly.Variables(2).ValuesAsNumpy()
hourly_precipitation_probability = hourly.Variables(3).ValuesAsNumpy()
hourly_surface_pressure = hourly.Variables(4).ValuesAsNumpy()
hourly_cloud_cover = hourly.Variables(5).ValuesAsNumpy()
hourly_relative_humidity_2m = hourly.Variables(6).ValuesAsNumpy()
hourly_wind_speed_10m = hourly.Variables(7).ValuesAsNumpy()
hourly_soil_temperature_6cm = hourly.Variables(8).ValuesAsNumpy()
hourly_soil_moisture_0_to_1cm = hourly.Variables(9).ValuesAsNumpy()
hourly_wind_direction_10m = hourly.Variables(10).ValuesAsNumpy()
hourly_rain = hourly.Variables(11).ValuesAsNumpy()
hourly_apparent_temperature = hourly.Variables(12).ValuesAsNumpy()
hourly_uv_index = hourly.Variables(13).ValuesAsNumpy()
hourly_sunshine_duration = hourly.Variables(14).ValuesAsNumpy()
hourly_direct_radiation = hourly.Variables(15).ValuesAsNumpy()
hourly_shortwave_radiation = hourly.Variables(16).ValuesAsNumpy()
hourly_uv_index_clear_sky = hourly.Variables(17).ValuesAsNumpy()

hourly_data = {
	"date": pd.date_range(
		start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
		end =  pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
		freq = pd.Timedelta(seconds = hourly.Interval()),
		inclusive = "left"
	).tz_convert(response.Timezone().decode())
}

hourly_data["temperature_2m"] = hourly_temperature_2m
hourly_data["pressure_msl"] = hourly_pressure_msl
hourly_data["evapotranspiration"] = hourly_evapotranspiration
hourly_data["precipitation_probability"] = hourly_precipitation_probability
hourly_data["surface_pressure"] = hourly_surface_pressure
hourly_data["cloud_cover"] = hourly_cloud_cover
hourly_data["relative_humidity_2m"] = hourly_relative_humidity_2m
hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
hourly_data["soil_temperature_6cm"] = hourly_soil_temperature_6cm
hourly_data["soil_moisture_0_to_1cm"] = hourly_soil_moisture_0_to_1cm
hourly_data["wind_direction_10m"] = hourly_wind_direction_10m
hourly_data["rain"] = hourly_rain
hourly_data["apparent_temperature"] = hourly_apparent_temperature
hourly_data["uv_index"] = hourly_uv_index
hourly_data["sunshine_duration"] = hourly_sunshine_duration
hourly_data["direct_radiation"] = hourly_direct_radiation
hourly_data["shortwave_radiation"] = hourly_shortwave_radiation
hourly_data["uv_index_clear_sky"] = hourly_uv_index_clear_sky

hourly_dataframe = pd.DataFrame(data = hourly_data)
print("\nHourly data\n", hourly_dataframe)

# Process daily data. The order of variables needs to be the same as requested.
daily = response.Daily()
daily_weather_code = daily.Variables(0).ValuesAsNumpy()
daily_temperature_2m_max = daily.Variables(1).ValuesAsNumpy()
daily_sunrise = daily.Variables(2).ValuesInt64AsNumpy()
daily_sunset = daily.Variables(3).ValuesInt64AsNumpy()
daily_sunshine_duration = daily.Variables(4).ValuesAsNumpy()
daily_daylight_duration = daily.Variables(5).ValuesAsNumpy()
daily_uv_index_clear_sky_max = daily.Variables(6).ValuesAsNumpy()
daily_precipitation_hours = daily.Variables(7).ValuesAsNumpy()
daily_precipitation_sum = daily.Variables(8).ValuesAsNumpy()
daily_precipitation_probability_max = daily.Variables(9).ValuesAsNumpy()
daily_wind_speed_10m_max = daily.Variables(10).ValuesAsNumpy()
daily_wind_gusts_10m_max = daily.Variables(11).ValuesAsNumpy()
daily_et0_fao_evapotranspiration = daily.Variables(12).ValuesAsNumpy()
daily_apparent_temperature_min = daily.Variables(13).ValuesAsNumpy()
daily_apparent_temperature_max = daily.Variables(14).ValuesAsNumpy()
daily_temperature_2m_min = daily.Variables(15).ValuesAsNumpy()

daily_data = {
	"date": pd.date_range(
		start = pd.to_datetime(daily.Time(), unit = "s", utc = True),
		end =  pd.to_datetime(daily.TimeEnd(), unit = "s", utc = True),
		freq = pd.Timedelta(seconds = daily.Interval()),
		inclusive = "left"
	).tz_convert(response.Timezone().decode())
}

daily_data["weather_code"] = daily_weather_code
daily_data["temperature_2m_max"] = daily_temperature_2m_max
daily_data["sunrise"] = daily_sunrise
daily_data["sunset"] = daily_sunset
daily_data["sunshine_duration"] = daily_sunshine_duration
daily_data["daylight_duration"] = daily_daylight_duration
daily_data["uv_index_clear_sky_max"] = daily_uv_index_clear_sky_max
daily_data["precipitation_hours"] = daily_precipitation_hours
daily_data["precipitation_sum"] = daily_precipitation_sum
daily_data["precipitation_probability_max"] = daily_precipitation_probability_max
daily_data["wind_speed_10m_max"] = daily_wind_speed_10m_max
daily_data["wind_gusts_10m_max"] = daily_wind_gusts_10m_max
daily_data["et0_fao_evapotranspiration"] = daily_et0_fao_evapotranspiration
daily_data["apparent_temperature_min"] = daily_apparent_temperature_min
daily_data["apparent_temperature_max"] = daily_apparent_temperature_max
daily_data["temperature_2m_min"] = daily_temperature_2m_min

daily_dataframe = pd.DataFrame(data = daily_data)
print("\nDaily data\n", daily_dataframe)
