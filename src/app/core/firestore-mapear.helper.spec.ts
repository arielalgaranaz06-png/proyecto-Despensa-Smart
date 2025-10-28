import { FirestoreMapear } from './firestore-mapear.helper'; //aqui salio error al cambiar el environment, le agregue el punto

describe('FirestoreMapear', () => {
  it('should create an instance', () => {
    expect(new FirestoreMapear()).toBeTruthy();
  });
});
