export const getKaizenSubtitle = async () => {
  const heartIconText = await fetch("/assets/images/emojis/heart-empty.svg").then(res => res.text());
  const heartIcon = heartIconText.replace(/width="\d+" height="\d+"/g, "class=\"subtitle-icon\"");
  return `Built with ${heartIcon} <br/> by Makemepulse`;
};