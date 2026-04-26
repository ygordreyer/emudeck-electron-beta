/**
 * macWrappers/EmulatorConfiguration.jsx
 *
 * Vendored copy of components/organisms/Wrappers/EmulatorConfiguration.jsx
 * (which lives in the read-only emudeck-gui-components submodule).
 *
 * The only change is replacing the hard-coded darwin guard
 *   if (system === 'darwin') { if (id !== 'ra') return; }
 * with a proper allowlist so all 16 supported macOS emulators appear.
 *
 * DO NOT edit the submodule file — edit this file instead.
 */
import { useTranslation } from 'react-i18next';
import React, { useContext } from 'react';
import { GlobalContext } from 'context/globalContext';
import PropTypes from 'prop-types';
import Main from 'components/organisms/Main/Main';
import Card from 'components/molecules/Card/Card';

// macOS emulator allowlist — mirrors darwin/data/macSources.json (macSkip !== true)
const MAC_EMUS = new Set([
  'ra', 'dolphin', 'duckstation', 'ppsspp', 'mgba', 'scummvm', 'mame',
  'melonds', 'flycast', 'pcsx2', 'xemu', 'rpcs3', 'vita3k', 'cemu',
  'shadps4', 'azahar',
]);

function EmulatorConfiguration({ onClick, images }) {
  const { t, i18n } = useTranslation();
  const { state } = useContext(GlobalContext);
  const { overwriteConfigEmus, second, system, branch } = state;
  const overwriteConfigEmusArray = Object.values(overwriteConfigEmus);

  return (
    <>
      <Main>
        <div className="cards cards--mini">
          {overwriteConfigEmusArray.map((item) => {
            if (
              overwriteConfigEmusArray.id === 'srm' ||
              item.id === 'primehacks'
            ) {
              return;
            }

            if (system === 'win32') {
              if (item.id === 'rmg' || item.id === 'ares') {
                return;
              }
            }

            // macOS: only show emulators that have a working darwin backend
            if (system === 'darwin' && !MAC_EMUS.has(item.id)) {
              return;
            }

            if (item.id === 'ares') {
              return;
            }

            if (item.id === 'yuzu') {
              return;
            }

            if (item.id === 'eden') {
              return;
            }

            if (item.id === 'citron') {
              return;
            }

            if (item.id === 'srm') {
              return;
            }

            const img = images[item.id];
            // eslint-disable-next-line consistent-return
            return (
              <Card
                css={item.status === true && 'is-selected'}
                key={item.id}
                onClick={() => onClick(item.id)}
              >
                <img src={img} alt={item.name} />
                <span className="h6">{item.name}</span>
              </Card>
            );
          })}
        </div>
      </Main>
    </>
  );
}

EmulatorConfiguration.propTypes = {
  onClick: PropTypes.func,
  images: PropTypes.array,
};

EmulatorConfiguration.defaultProps = {
  onClick: '',
  images: '',
};

export default EmulatorConfiguration;
