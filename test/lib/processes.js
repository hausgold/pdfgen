const processes = new (require(Suite.root('lib/processes')));
const spawn = require('child_process').spawn;

describe('Processes', function() {
  Suite.propperProcessTimeout(this);

  describe('#children', () => {
    describe('without backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('detects no processes', () => {
        expect(processes.children()).to.be.empty();
      });

      it('detects a single process', (done) => {
        Suite.spwanSleep();
        expect(processes.children()).not.to.be.empty();
        done();
      });

      it('detects pid correctly on process', (done) => {
        const sleep = Suite.spwanSleep();
        expect(processes.children().shift().pid).to.be(sleep.pid);
        done();
      });

      it('detects command correctly on process', (done) => {
        Suite.spwanSleep();
        expect(processes.children().shift().command).to.be('/bin/sleep');
        done();
      });

      it('detects arguments correctly on process', (done) => {
        const sleep = Suite.spwanSleep();
        expect(processes.children().shift().arguments.shift())
          .to.be(sleep.id.toString());
        done();
      });

      it('detects parent pid correctly on process', (done) => {
        Suite.spwanSleep();
        expect(processes.children().shift().ppid).to.be(process.pid);
        done();
      });
    });

    describe('with backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('detects no processes', () => {
        expect(processes.children(true)).to.be.empty();
      });

      it('detects a single process', (done) => {
        Suite.spwanSleepLater();
        expect(processes.children(true)).not.to.be.empty();
        done();
      });
    });
  });

  describe('#grepChildren', () => {
    describe('without backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('detects a single process', (done) => {
        Suite.spwanSleep();
        expect(processes.grepChildren(/sleep/)).not.to.be.empty();
        done();
      });

      it('detects multiple processes', (done) => {
        Suite.spwanSleep();
        Suite.spwanSleep();
        expect(processes.grepChildren(/sleep/)).to.have.length(2);
        done();
      });

      it('does not detect too slow processes', (done) => {
        Suite.spwanSleepLater(10);
        expect(processes.grepChildren(/sleep/)).to.be.empty();
        done();
      });
    });

    describe('with backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('detects a single process', (done) => {
        Suite.spwanSleepLater();
        expect(processes.grepChildren(/sleep/, true)).not.to.be.empty();
        done();
      });

      it('does not detect too slow processes', (done) => {
        Suite.spwanSleepLater(10);
        expect(processes.grepChildren(/sleep/, true)).to.be.empty();
        done();
      });
    });
  });

  describe('#kill', () => {
    describe('without backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('kills a single process', (done) => {
        Suite.spwanSleep();
        processes.kill(9, processes.grepChildren(/sleep/));
        expect(processes.grepChildren(/sleep/)).to.be.empty();
        done();
      });

      it('kills multiple processes', (done) => {
        Suite.spwanSleep();
        Suite.spwanSleep();
        processes.kill(9, processes.grepChildren(/sleep/));
        expect(processes.grepChildren(/sleep/)).to.be.empty();
        done();
      });

      it('kills nothing on an empty process list', (done) => {
        Suite.spwanSleep();
        processes.kill(9, []);
        expect(processes.grepChildren(/sleep/)).not.to.be.empty();
        done();
      });
    });

    describe('with backoff', () => {
      afterEach(() => { Suite.killSleeps(); })

      it('kills a single process', (done) => {
        Suite.spwanSleepLater();
        processes.kill(9, processes.grepChildren(/sleep/, true), true);
        expect(processes.grepChildren(/sleep/)).to.be.empty();
        done();
      });

      it('kills multiple processes', (done) => {
        Suite.spwanSleepLater(1);
        Suite.spwanSleepLater(1);
        processes.kill(9, processes.grepChildren(/sleep/, true), true);
        expect(processes.grepChildren(/sleep/)).to.be.empty();
        done();
      });
    });
  });
});
