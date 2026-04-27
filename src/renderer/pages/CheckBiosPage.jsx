import { useTranslation } from 'react-i18next';
import React, { useEffect, useState, useContext, useRef } from 'react';
import { GlobalContext } from 'context/globalContext';
import Wrapper from 'components/molecules/Wrapper/Wrapper';

import Header from 'components/organisms/Header/Header';
import Footer from 'components/organisms/Footer/Footer';
import { useNavigate } from 'react-router-dom';
import CheckBios from 'components/organisms/Wrappers/CheckBios';
import EmuModal from 'components/molecules/EmuModal/EmuModal';
import { BtnSimple, BtnGroup } from 'getbasecore/Atoms';
import ProgressBar from 'components/atoms/ProgressBar/ProgressBar';

function CheckBiosPage() {
  const { t, i18n } = useTranslation();
  const { state, setState } = useContext(GlobalContext);

  const [statePage, setStatePage] = useState({
    disabledNext: true,
    disabledBack: false,
    showNotification: false,
    dom: undefined,
  });

  // TODO: Use only one state for bioses, doing it this way is quick but madness
  const [ps1Bios, setps1Bios] = useState(null);
  const [ps2Bios, setps2Bios] = useState(null);
  const [switchBios, setSwitchBios] = useState(null);
  const [edenBios, setEdenBios] = useState(null);
  const [citronBios, setCitronBios] = useState(null);
  const [ryujinxBios, setRyujinxBios] = useState(null);
  const [segaCDBios, setSegaCDBios] = useState(null);
  const [saturnBios, setSaturnBios] = useState(null);
  const [dreamcastBios, setDreamcastBios] = useState(null);
  const [DSBios, setDSBios] = useState(null);

  // Modal for BIOS installer disclaimer + progress
  const [biosModal, setBiosModal] = useState({ active: false });

  const { disabledNext, disabledBack, showNotification, dom } = statePage;
  const navigate = useNavigate();
  const ipcChannel = window.electron.ipcRenderer;

  const checkBios = (biosCommand) => {
    ipcChannel.sendMessage('emudeck', [`${biosCommand}|||${biosCommand}`]);
    ipcChannel.once(`${biosCommand}`, (status) => {
      status = status.stdout;

      status = status.replace('\n', '');
      let biosStatus;
      status.includes('true') ? (biosStatus = true) : (biosStatus = false);

      switch (biosCommand) {
        case 'checkPS1BIOS':
          setps1Bios(biosStatus);
          break;
        case 'checkPS2BIOS':
          setps2Bios(biosStatus);
          break;
        case 'checkYuzuBios':
          setSwitchBios(biosStatus);
          break;
        case 'checkEdenBios':
          setEdenBios(biosStatus);
          break;
        case 'checkRyujinxBios':
          setRyujinxBios(biosStatus);
          break;
        case 'checkCitronBios':
          setCitronBios(biosStatus);
          break;
        case 'checkSegaCDBios':
          setSegaCDBios(biosStatus);
          break;
        case 'checkSaturnBios':
          setSaturnBios(biosStatus);
          break;
        case 'checkDreamcastBios':
          setDreamcastBios(biosStatus);
          break;
        case 'checkDSBios':
          setDSBios(biosStatus);
          break;
      }
    });
  };

  const checkBiosAgain = () => {
    checkBios('checkPS1BIOS');
    checkBios('checkPS2BIOS');
    checkBios('checkYuzuBios');
    checkBios('checkRyujinxBios');
    checkBios('checkCitronBios');
    checkBios('checkSegaCDBios');
    checkBios('checkSaturnBios');
    checkBios('checkDreamcastBios');
    checkBios('checkDSBios');
  };

  const closeBiosModal = () => setBiosModal({ active: false });

  // ── BIOS Pack Installer ──────────────────────────────────────────────────
  // packType: "essential" (~45 MB, 36 mandatory files) or "full" (~1.7 GB, 528 files)
  const installBiosPack = (packType) => {
    const sizeLabel = packType === 'full' ? '~1.7 GB' : '~45 MB';
    setBiosModal({
      active: true,
      header: (
        <span className="h4">Downloading BIOS Pack ({sizeLabel})…</span>
      ),
      body: (
        <div>
          <p>
            Please wait. Downloading missing BIOS files from the community
            retrobios repository into your EmuDeck BIOS folder.
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>
            Files are verified by SHA1 hash. Already-correct files are skipped.
          </p>
        </div>
      ),
      footer: <ProgressBar css="progress--success" infinite max="100" />,
    });

    ipcChannel.sendMessage('emudeck', [
      `RetroBios_install|||RetroBios_install ${packType}`,
    ]);

    ipcChannel.once('RetroBios_install', (message) => {
      const output = [message.stdout, message.stderr]
        .filter(Boolean)
        .join('\n')
        .trim();
      const succeeded = (message.stdout || '').includes('true');

      if (succeeded) {
        setBiosModal({
          active: true,
          header: <span className="h4">✅ BIOS Pack installed!</span>,
          body: (
            <p>
              BIOS files have been placed in your EmuDeck BIOS folder.
              The BIOS status indicators below have been refreshed.
            </p>
          ),
          footer: (
            <BtnSimple
              css="btn-simple--1"
              type="button"
              aria="Close"
              onClick={() => {
                closeBiosModal();
                checkBiosAgain();
              }}
            >
              Done
            </BtnSimple>
          ),
        });
        // Auto-refresh BIOS status checks
        checkBiosAgain();
      } else {
        setBiosModal({
          active: true,
          header: <span className="h4">BIOS Pack install failed</span>,
          body: (
            <div>
              <p>Something went wrong during the BIOS pack download.</p>
              {output && (
                <>
                  <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                    Output:
                  </p>
                  <pre
                    style={{
                      maxHeight: '160px',
                      overflow: 'auto',
                      fontSize: '0.7rem',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {output}
                  </pre>
                  <BtnSimple
                    css="btn-simple--2"
                    type="button"
                    aria="Copy output"
                    onClick={() => navigator.clipboard.writeText(output)}
                    style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
                  >
                    Copy output
                  </BtnSimple>
                </>
              )}
              <p
                style={{
                  fontSize: '0.7rem',
                  opacity: 0.6,
                  marginTop: '0.5rem',
                }}
              >
                Full log: ~/.config/EmuDeck/logs/emudeckApp.log
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>
                Common causes: no internet connection, Python 3 not installed,
                or GitHub rate-limiting.
              </p>
            </div>
          ),
          footer: (
            <BtnSimple
              css="btn-simple--2"
              type="button"
              aria="Close"
              onClick={closeBiosModal}
            >
              Close
            </BtnSimple>
          ),
        });
      }
    });
  };

  // Show the legal disclaimer modal before downloading
  const askBiosPack = (packType) => {
    const sizeLabel = packType === 'full' ? '~1.7 GB' : '~45 MB';
    const filesLabel = packType === 'full' ? '528 files for all cores' : '36 essential files';
    setBiosModal({
      active: true,
      header: <span className="h4">⚖️ Legal Disclaimer — Community BIOS Pack</span>,
      body: (
        <div>
          <p>
            EmuDeck does <strong>not</strong> host, create, or endorse BIOS
            files. Clicking "I Agree" will download a community-maintained pack
            from a{' '}
            <strong>third-party GitHub repository</strong> (
            <a
              href="https://github.com/Abdess/retrobios"
              target="_blank"
              rel="noreferrer"
            >
              Abdess/retrobios
            </a>
            ).
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            <strong>Selected:</strong> {sizeLabel} — {filesLabel}
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            BIOS files are <strong>copyrighted software</strong>. You should
            only use BIOS files dumped from hardware you <strong>legally own</strong>.
            EmuDeck and its developers are <strong>not liable</strong> for any
            misuse of these files or for the contents of the third-party
            repository.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            By proceeding you confirm:
          </p>
          <ul style={{ marginLeft: '1rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <li>You take full responsibility for legal compliance in your jurisdiction.</li>
            <li>EmuDeck is not responsible for how you use these files.</li>
            <li>The files are provided by a community project, not EmuDeck.</li>
          </ul>
        </div>
      ),
      footer: (
        <BtnGroup>
          <BtnSimple
            css="btn-simple--2"
            type="button"
            aria="Cancel"
            onClick={closeBiosModal}
          >
            Cancel
          </BtnSimple>
          <BtnSimple
            css="btn-simple--1"
            type="button"
            aria="I Agree — Download"
            onClick={() => installBiosPack(packType)}
          >
            I Agree — Download
          </BtnSimple>
        </BtnGroup>
      ),
      css: 'emumodal--sm',
    });
  };
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    checkBios('checkPS1BIOS');
    checkBios('checkPS2BIOS');
    checkBios('checkYuzuBios');
    checkBios('checkRyujinxBios');
    checkBios('checkCitronBios');
    checkBios('checkSegaCDBios');
    checkBios('checkSaturnBios');
    checkBios('checkDreamcastBios');
    checkBios('checkDSBios');
  }, []);

  return (
    <Wrapper>
      <Header title={t('CheckBiosPage.title')} />
      <p className="lead">{t('CheckBiosPage.description')}</p>

      <CheckBios
        checkBiosAgain={checkBiosAgain}
        ps1Bios={ps1Bios}
        ps2Bios={ps2Bios}
        switchBios={switchBios}
        ryujinxBios={ryujinxBios}
        citronBios={citronBios}
        segaCDBios={segaCDBios}
        saturnBios={saturnBios}
        dreamcastBios={dreamcastBios}
        DSBios={DSBios}
        showNotification={showNotification}
      />
      {/* ── Community BIOS Pack installer — compact bar below BIOS list ── */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '200px' }}>
          <strong style={{ fontSize: '0.9rem' }}>
            Auto-install BIOS (Community)
          </strong>
          <p style={{ fontSize: '0.75rem', opacity: 0.65, margin: '0.2rem 0 0' }}>
            Downloads from{' '}
            <a
              href="https://github.com/Abdess/retrobios"
              target="_blank"
              rel="noreferrer"
            >
              retrobios
            </a>
            {' '}— legal disclaimer required. Skips already-correct files.
          </p>
        </div>
        <BtnSimple
          css="btn-simple--1"
          type="button"
          aria="Essential Pack ~45 MB"
          onClick={() => askBiosPack('essential')}
        >
          Essential (~45 MB)
        </BtnSimple>
        <BtnSimple
          css="btn-simple--2"
          type="button"
          aria="Full Pack ~1.7 GB"
          onClick={() => askBiosPack('full')}
        >
          Full (~1.7 GB)
        </BtnSimple>
      </div>
      {/* ──────────────────────────────────────────────────────────────────── */}

      <Footer
        next={false}
        disabledNext={disabledNext}
        disabledBack={disabledBack}
      />
      <EmuModal modal={biosModal} />
    </Wrapper>
  );
}

export default CheckBiosPage;
