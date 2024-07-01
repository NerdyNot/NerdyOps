import { mdiDownload } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import CardBox from '../components/CardBox';
import { getPageTitle } from '../config';
import axios from 'axios';
import Button from '../components/Button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // CommonJS 스타일로 import
import { useBackendUrl } from '../contexts/BackendUrlContext';

const AgentDownloadPage: React.FC = () => {
  const [osType, setOsType] = useState<string>('linux');
  const [archType, setArchType] = useState<string>('amd64');
  const [availableArchs, setAvailableArchs] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const { backendUrl } = useBackendUrl();

  useEffect(() => {
    const archsByOS: { [key: string]: string[] } = {
      linux: ['amd64', '386', 'arm', 'arm64'],
      windows: ['amd64', '386'],
      darwin: ['amd64', 'arm64']
    };

    setAvailableArchs(archsByOS[osType] || []);
    setArchType(archsByOS[osType][0]);
  }, [osType]);

  const handleDownloadClick = async () => {
    try {
      const response = await axios.get(`${backendUrl}/install-agent`, {
        params: { os_type: osType, arch_type: archType },
        responseType: 'blob', // 파일 다운로드를 위한 설정
      });

      // 다운로드를 위한 링크 생성 및 클릭
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NerdyOps-Agent-${osType}-${archType}${osType === 'windows' ? '.zip' : '.tar.gz'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading agent:', err);
      alert('Failed to download agent.');
    }
  };

  const getInstallationGuide = () => {
    switch (osType) {
      case 'linux':
        return (
          <div>
            <h3 className="text-lg font-bold mb-2">Linux Installation Guide</h3>
            <p>1. Open a terminal and navigate to the location where the file was downloaded.</p>
            <p>2. Extract the file using the following command:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`tar -xzf NerdyOps-Agent-linux-${archType}.tar.gz`}
            </SyntaxHighlighter>
            <p>3. Make the binary executable:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`chmod +x NerdyOps-Agent-linux-${archType}`}
            </SyntaxHighlighter>
            <p>4. Run the agent in the background:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`./NerdyOps-Agent-linux-${archType} &`}
            </SyntaxHighlighter>
            <p>5. To register the agent as a service using systemd:</p>
            <SyntaxHighlighter language="ini" style={atomDark}>
              {`
[Unit]
Description=NerdyOps Agent
After=network.target

[Service]
ExecStart=/path/to/NerdyOps-Agent-linux-${archType}
Restart=always

[Install]
WantedBy=multi-user.target
              `}
            </SyntaxHighlighter>
            <p>Save this file as /etc/systemd/system/nerdyops-agent.service.</p>
            <p>Then, run the following commands to start and enable the service:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`sudo systemctl start nerdyops-agent\nsudo systemctl enable nerdyops-agent`}
            </SyntaxHighlighter>
          </div>
        );
      case 'windows':
        return (
          <div>
            <h3 className="text-lg font-bold mb-2">Windows Installation Guide</h3>
            <p>1. Extract the downloaded zip file.</p>
            <p>2. Open a Command Prompt and navigate to the directory where the file was extracted.</p>
            <p>3. Run the agent using the following command:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`NerdyOps-Agent-windows-${archType}.exe`}
            </SyntaxHighlighter>
            <p>4. To register the agent as a service using NSSM (Non-Sucking Service Manager):</p>
            <p>Run the following command in Command Prompt:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`nssm install NerdyOpsAgent "C:\\path\\to\\NerdyOps-Agent-windows-${archType}.exe"`}
            </SyntaxHighlighter>
            <p>After installation, you can start the service using NSSM service manager.</p>
          </div>
        );
      case 'darwin':
        return (
          <div>
            <h3 className="text-lg font-bold mb-2">MacOS Installation Guide</h3>
            <p>1. Open a terminal and navigate to the location where the file was downloaded.</p>
            <p>2. Extract the file using the following command:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`tar -xzf NerdyOps-Agent-darwin-${archType}.tar.gz`}
            </SyntaxHighlighter>
            <p>3. Make the binary executable:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`chmod +x NerdyOps-Agent-darwin-${archType}`}
            </SyntaxHighlighter>
            <p>4. Run the agent in the background:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`./NerdyOps-Agent-darwin-${archType} &`}
            </SyntaxHighlighter>
            <p>5. To register the agent as a service using launchd:</p>
            <SyntaxHighlighter language="xml" style={atomDark}>
              {`
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.nerdyops.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>/path/to/NerdyOps-Agent-darwin-${archType}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
              `}
            </SyntaxHighlighter>
            <p>Save this file as ~/Library/LaunchAgents/com.nerdyops.agent.plist.</p>
            <p>Then, run the following command to load and start the service:</p>
            <SyntaxHighlighter language="bash" style={atomDark}>
              {`launchctl load ~/Library/LaunchAgents/com.nerdyops.agent.plist`}
            </SyntaxHighlighter>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Download Agent')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiDownload} title="Download Agent" main />

        <CardBox className="mb-6">
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="osType" className="block text-sm font-medium text-gray-700">
                Operating System
              </label>
              <select
                id="osType"
                name="osType"
                value={osType}
                onChange={(e) => setOsType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
                <option value="darwin">MacOS</option>
              </select>
            </div>

            <div>
              <label htmlFor="archType" className="block text-sm font-medium text-gray-700">
                Architecture
              </label>
              <select
                id="archType"
                name="archType"
                value={archType}
                onChange={(e) => setArchType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {availableArchs.map((arch) => (
                  <option key={arch} value={arch}>
                    {arch}
                  </option>
                ))}
              </select>
            </div>

            <Button
              icon={mdiDownload}
              color="primary"
              onClick={handleDownloadClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Download Agent
            </Button>
          </div>
        </CardBox>

        <CardBox className="mb-6">
          {getInstallationGuide()}
        </CardBox>
      </SectionMain>
    </>
  );
};

AgentDownloadPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentDownloadPage;
