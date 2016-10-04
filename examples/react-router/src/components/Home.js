import React from 'react';
import { FormattedDate } from 'react-intl';

const Home = () => (
    <div>
        <h2>Home</h2>
        <p>
            Today is {' '}
            <FormattedDate value={Date.now()} />
        </p>
    </div>
);
export default Home;
