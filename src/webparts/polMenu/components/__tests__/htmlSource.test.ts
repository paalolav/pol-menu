import {
  assertAllowedResponseOrigin,
  parseAllowedHosts,
  resolveAllowedUrl,
  sanitizeHtml
} from '../htmlSource';

describe('HTML source security controls', () => {
  describe('source allow-list', () => {
    test('normalizes hostnames and origins without widening invalid entries', () => {
      expect(parseAllowedHosts('cdn.example.com, https://assets.example.com/path, :bad')).toEqual([
        'https://cdn.example.com',
        'https://assets.example.com'
      ]);
    });

    test('allows same-origin and explicitly allowed HTTPS sources', () => {
      expect(resolveAllowedUrl('/SiteAssets/menu.html', 'https://tenant.example', undefined)).toBe(
        'https://tenant.example/SiteAssets/menu.html'
      );
      expect(
        resolveAllowedUrl(
          'https://cdn.example.com/menu.html',
          'https://tenant.example',
          'cdn.example.com'
        )
      ).toBe('https://cdn.example.com/menu.html');
    });

    test('rejects unlisted, non-HTTPS, and redirected sources', () => {
      expect(() =>
        resolveAllowedUrl('https://attacker.example/menu.html', 'https://tenant.example', undefined)
      ).toThrow('not an allowed source');
      expect(() =>
        resolveAllowedUrl('http://tenant.example/menu.html', 'https://tenant.example', undefined)
      ).toThrow('Only https:// sources are allowed');
      expect(() =>
        assertAllowedResponseOrigin(
          'https://attacker.example/menu.html',
          'https://tenant.example',
          undefined
        )
      ).toThrow('redirected');
    });
  });

  describe('markup sanitizer', () => {
    test('removes executable markup while preserving safe HTML and CSS', () => {
      const result = sanitizeHtml(
        '<style>.menu{color:red}</style><a class="menu" href="/safe" onclick="alert(1)">Safe</a>' +
          '<script>alert(1)</script><iframe src="https://attacker.example"></iframe>'
      );

      expect(result).toContain('<style>.menu{color:red}</style>');
      expect(result).toContain('href="/safe"');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<iframe');
    });

    test('rejects protocol-relative URLs instead of treating them as local paths', () => {
      const result = sanitizeHtml(
        '<a href="//attacker.example/phish">bad link</a>' +
          '<img src="//attacker.example/tracker.gif">'
      );

      expect(result).not.toContain('href=');
      expect(result).not.toContain('src=');
    });

    test('removes legacy script-bearing CSS constructs', () => {
      const scriptScheme = ['java', 'script:'].join('');
      const result = sanitizeHtml(
        `<style>.bad{background:url(${scriptScheme}alert(1))}</style>` +
          '<span style="behavior:url(test.htc)">text</span>'
      );

      expect(result).not.toContain(scriptScheme);
      expect(result).not.toContain('behavior:');
    });
  });
});
