import { setSubtitleContent } from "@/store/modules/Subtitles";

function convertToSeconds(time: string) {
  const parts = time.split(",");
  const [hours, minutes, seconds] = parts[0].split(":").map(part => parseFloat(part));
  return hours * 3600 + minutes * 60 + parseFloat((seconds as any)) + parseFloat(parts[1]) / 1000;
}

async function replaceEmojiWithSVG(text: string): Promise<string> {
  const regex = /\{(.*?)\}/g;
  const matches = [];
  let match;
  // Collect all matches
  while ((match = regex.exec(text))) {
    matches.push(match);
  }

  // Replace each match with its SVG
  for (const match of matches) {
    const name = match[1];
    const svgUrl = `/assets/images/emojis/${name}.svg`;
    try {
      const response = await fetch(svgUrl);
      const svgContent = await response.text();
      text = text.replace(`{${match[1]}}`, `<span class="svg-icon">${svgContent}</span>`);
    } catch (error) {
      console.error("Failed to load SVG:", error);
      text = text.replace(`{${match[1]}}`, ""); // Replace with empty string if error
    }
  }

  return text;
}

export function replaceTextWithBrush(text: string): string {
  return text.replace(/<strong>(.*?)<\/strong>/g, (match, content) => {
    const svg = `
      <svg preserveAspectRatio="none" viewBox="0 0 96 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.50359 25.2177C5.35697 24.3046 5.25046 23.6454 5.13721 22.929C5.49001 22.8125 5.80081 22.7096 6.19283 22.5793C5.78243 21.6746 5.21912 22.0784 4.74642 22.0174C4.04418 21.9303 3.34483 21.8394 2.6427 21.7482C2.64319 21.6307 2.6408 21.517 2.6413 21.3995C2.84386 21.2982 3.04919 21.1971 3.25187 21.0917C3.23395 21.038 3.22014 20.9357 3.20075 20.9346C2.00998 20.7571 1.13881 19.8611 0.547526 18.3778C0.0756476 17.1896 -0.0849813 15.8825 0.041573 14.5237C0.132397 13.552 0.272963 12.5874 0.372096 11.6163C0.494261 10.4154 1.23805 8.70876 1.92616 8.40573C2.19656 7.46114 2.28301 6.3473 2.70687 5.87016C3.29976 5.20051 4.12403 4.8895 4.88004 4.63924C5.72845 4.35808 6.61477 4.31032 7.48672 4.1806C8.74855 3.99743 10.0097 3.83854 11.2713 3.66346C12.8419 3.45031 14.408 3.20038 15.9805 3.01978C18.0094 2.78569 20.0395 2.60843 22.0679 2.39458C23.8208 2.20868 25.5695 1.97791 27.3221 1.80415C28.8132 1.65512 30.3082 1.56714 31.8018 1.43042C33.3816 1.28674 34.9597 1.10242 36.5392 0.966847C37.4569 0.888549 38.3867 0.973166 39.2983 0.81341C40.3354 0.632857 41.3688 0.780511 42.4029 0.70925C43.548 0.632545 44.6942 0.616726 45.8383 0.576452C48.4458 0.486833 51.0529 0.413415 53.6611 0.29951C55.4304 0.224066 57.2007 0.0108288 58.971 0.000317599C60.6913 -0.00916112 62.4111 0.196224 64.1323 0.255725C66.0779 0.324748 68.0361 0.540501 69.9675 0.320789C71.3841 0.159138 72.7607 0.538378 74.1578 0.476918C74.9217 0.442028 75.7261 0.84749 76.4534 0.631984C78.8954 -0.0920555 81.3229 0.707568 83.7565 0.587156C85.265 0.512157 86.7931 0.628912 88.292 0.897977C88.8745 1.00214 89.3995 1.77588 89.9171 2.2167C90.4517 2.24903 91.0813 2.05601 91.5611 2.36074C92.8367 3.17584 94.1013 4.09163 95.2545 5.21965C95.6786 5.63454 96.3952 6.50096 95.7273 7.6729C95.6456 7.81798 95.7057 8.25141 95.7939 8.47164C96.1443 9.34025 96.1028 9.93376 95.2056 10.0741C95.3229 11.1435 95.487 12.1266 95.5149 13.1176C95.5317 13.7106 95.3317 14.3188 95.2127 15.005C95.304 15.1159 95.4703 15.3206 95.7412 15.6533C95.4471 15.5544 95.2877 15.5001 94.9853 15.4007C95.1773 15.8786 95.3148 16.2235 95.4185 16.4852C94.8294 18.5134 94.2415 20.5011 93.6727 22.5021C93.3713 23.5624 92.7973 24.1521 92.1339 24.6634C91.6661 25.0243 91.3152 25.7694 90.67 25.4263C90.506 25.3394 90.3177 25.328 90.1403 25.3213C89.6995 25.3109 89.1998 24.7251 88.8511 25.6934C88.7727 25.9157 88.3987 25.9985 88.163 25.9924C86.9433 25.9591 85.7279 25.8694 84.5087 25.8159C83.0984 25.7509 81.6854 25.6857 80.2744 25.645C78.2813 25.5893 76.2891 25.5985 74.2971 25.5024C72.4741 25.4124 70.6555 25.1686 68.8352 25.0828C66.7433 24.9847 64.6446 25.0361 62.5526 24.942C60.1864 24.8354 57.8258 24.6237 55.46 24.5009C54.6372 24.4592 53.8101 24.5755 52.9861 24.5743C51.9791 24.5742 50.9739 24.5053 49.9671 24.4971C47.5514 24.4726 45.1352 24.4684 42.7193 24.452C41.4073 24.4416 40.0969 24.3785 38.7865 24.4128C36.7127 24.4617 34.6375 24.5633 32.5625 24.6608C30.7153 24.7437 28.8652 24.8304 27.0199 24.9459C25.0245 25.0725 23.0309 25.2317 21.0376 25.3828C19.3306 25.5107 17.6258 25.7603 15.9202 25.7423C14.6943 25.729 13.4803 25.7894 12.2636 25.9469C12.13 25.9631 11.9892 25.837 11.8522 25.776C11.5454 25.6358 11.3055 25.0821 10.9155 25.841C10.754 26.1597 10.0677 25.8992 9.62078 25.9087C8.99616 25.9236 8.36296 26.0475 7.75036 25.9293C6.93083 25.7703 6.12756 25.4257 5.50359 25.2177Z" fill="currentColor" />
      </svg>
    `;
    return `<strong>${content} ${svg}</strong>`;
  });
}

async function parseSRT(srtContent: string) {
  const subtitles = [];
  const pattern = /(\d+)\r?\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\r?\n([\s\S]*?)(?=\r?\n\r?\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(srtContent))) {
    const start = convertToSeconds(match[2]);
    const end = convertToSeconds(match[3]);
    let text = match[4].replace(/\n/g, " "); // remove line breaks

    text = await replaceEmojiWithSVG(text);
    text = replaceTextWithBrush(text);

    subtitles.push({ start, end, text });
  }

  return subtitles;
}

export async function loadSRT(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Failed to load the SRT file : ${url}.`);
    return;
  }

  const srtContent = await response.text();
  const srtParsed = await parseSRT(srtContent);

  setSubtitleContent(url, srtParsed);
}