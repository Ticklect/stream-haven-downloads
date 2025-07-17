export const ResourceCleanup = {
  mediaStream: (stream: MediaStream) => {
    stream.getTracks().forEach(track => track.stop());
  },
  eventListeners: (element: HTMLElement, events: string[]) => {
    events.forEach(event => element.removeEventListener(event, () => {}));
  }
}; 