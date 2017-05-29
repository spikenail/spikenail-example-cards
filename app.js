import { Spikenail } from 'spikenail'
(async function () {
  try {
    await Spikenail.start();
  } catch (err) {
    console.error(err);
  }
})();