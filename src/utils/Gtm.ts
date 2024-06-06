type PageView = {
  title: string;
  location: string;
}

type SelectContent = {
  id: string;
  type: string;
}

export const SELECT_SOCIALS = new Map<string, SelectContent>([
  ["instagram", {
    id: "instagram",
    type: "socialmedia"
  }],
  ["x", {
    id: "x",
    type: "socialmedia"
  }],
  ["linkedin", {
    id: "linkedin",
    type: "socialmedia"
  }],
  ["website", {
    id: "mmpcom",
    type: "corporate"
  }]
]);

export function trackSelect(data: SelectContent) {
  try {
    window.dataLayer.push({
      event: "select_content",
      content_type: data.type,
      content_id: data.id
    });
  } catch (error) {
    console.error(error);
  }
}

export function trackPage(data: PageView) {
  try {
    window.dataLayer.push({
      event: "page_view",
      page_location: `/${data.location}`,
      page_title: data.title,
    });
  } catch (error) {
    console.error(error);
  }
}