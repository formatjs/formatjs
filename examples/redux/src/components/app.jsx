import React from 'react';

const App = () => (
  <div className="container" style={{ paddingTop: '50px' }}>
    <div className="jumbotron">
      <h1 className="display-4">Hello in English!</h1>
      <div className="form-group row">
        <label htmlFor="localesList" className="col-sm-12 col-md-2 col-form-label">Change language</label>
        <select className="form-control col-sm-12 col-md-2" id="localesList">
          <option>English</option>
          <option>Frensh</option>
          <option>Arabic</option>
        </select>
      </div>
      <h4>This is a sample text with <strong>HTML</strong> content.</h4>
      <hr className="my-2" />
      <h5>Today is {new Date().toString()}</h5>
      <h5>This example was developed {new Date().toString()} ago.</h5>
      <h5>Example of formatted number like 12.34 or price like 24.5$</h5>
    </div>
  </div>
);

export default App;
