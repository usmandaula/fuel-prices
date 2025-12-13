import React from 'react';
import GasStationsList, { GasStationData } from './GasStationsList';
import './GasStationsList.css'; // Import the CSS

const App: React.FC = () => {
  const gasStationData: GasStationData = {
    ok: true,
    // license: "CC BY 4.0 - https://creativecommons.tankerkoenig.de",
    // data: "MTS-K",
    status: "ok",
    stations: [
      {
        id: "474e5046-deaf-4f9b-9a32-9797b778f047",
        name: "TOTAL BERLIN",
        brand: "TOTAL",
        street: "MARGARETE-SOMMER-STR.",
        place: "BERLIN",
        lat: 52.53083,
        lng: 13.440946,
        dist: 1.1,
        diesel: 1.109,
        e5: 1.339,
        e10: 1.319,
        isOpen: true,
        houseNumber: "2",
        postCode: 10407
      },
      {
        id: "another-id-1234",
        name: "SHELL BERLIN MITTE",
        brand: "SHELL",
        street: "FRIEDRICHSTRASSE",
        place: "BERLIN",
        lat: 52.520008,
        lng: 13.404954,
        dist: 2.3,
        diesel: 1.119,
        e5: 1.349,
        e10: 1.329,
        isOpen: false,
        houseNumber: "100",
        postCode: 10117
      }
      // ... more stations
    ]
  };

  return (
    <div className="App">
      <GasStationsList data={gasStationData} />
    </div>
  );
};

export default App;