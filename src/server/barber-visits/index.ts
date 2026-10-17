import { createServer } from 'node:http';
import { isAbsolute } from 'node:path';
import { referenceCodes } from '../../lib/barber-visits';
import { dailyTotals } from './store';
import { visitListener } from './http';

const codes = referenceCodes(process.env.BARBER_REF_CODES || '');
const file = process.env.BARBER_COUNTS_FILE || '';
if (!codes.length || !isAbsolute(file))
  throw new Error('Set BARBER_REF_CODES and an absolute, private BARBER_COUNTS_FILE path.');
const server = createServer(
  visitListener({
    origin: 'https://fintaxtech.co.uk',
    codes,
    increment: dailyTotals(file),
  }),
);
server.requestTimeout = 5000;
server.headersTimeout = 5000;
server.maxConnections = 32;
server.maxHeadersCount = 30;
server.listen(Number(process.env.BARBER_VISIT_PORT || 4326), '127.0.0.1');
