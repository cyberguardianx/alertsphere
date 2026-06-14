async function run() {
  try {
    const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=London&count=1&language=en&format=json');
    console.log(await res.json());
  } catch (e) {
    console.error(e);
  }
}
run();
