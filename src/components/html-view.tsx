import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type HtmlViewProps = {
  html: string;
  onMessage: (data: string) => void;
  backgroundColor: string;
};

export function HtmlView({ html, onMessage, backgroundColor }: HtmlViewProps) {
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      onMessage={(event) => onMessage(event.nativeEvent.data)}
      // Only the generated page itself should ever load in here.
      onShouldStartLoadWithRequest={(request) => /^(about|data|blob):/.test(request.url)}
      setSupportMultipleWindows={false}
      setBuiltInZoomControls
      setDisplayZoomControls={false}
      style={[styles.view, { backgroundColor }]}
    />
  );
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
  },
});
